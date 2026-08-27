from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import (
    ClientProfile,
    Prospect,
    Quote,
    QuoteItem,
)


User = get_user_model()


class EmployeeCommercialWorkflowTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.employee = User.objects.create_user(
            username="commercial_employee",
            email="commercial.employee@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.prospect = Prospect.objects.create(
            first_name="Claire",
            last_name="Martin",
            email="claire.martin@test.local",
            phone="0611223344",
            company="Martin Events",
            city="Lyon",
            message=(
                "Demande pour organisation "
                "d'un événement professionnel."
            ),
        )

        self.api_client.force_authenticate(
            user=self.employee
        )

    def test_employee_can_list_prospects(self):
        response = self.api_client.get(
            "/api/prospects/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        results = response.data.get(
            "results",
            response.data,
        )

        prospect_ids = [
            prospect["id"]
            for prospect in results
        ]

        self.assertIn(
            self.prospect.id,
            prospect_ids,
        )

    def test_employee_can_retrieve_prospect(self):
        response = self.api_client.get(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.prospect.id,
        )

        self.assertEqual(
            response.data["email"],
            self.prospect.email,
        )

    def test_employee_can_update_prospect(self):
        response = self.api_client.patch(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/"
            ),
            {
                "city": "Paris",
                "phone": "0699887766",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.prospect.refresh_from_db()

        self.assertEqual(
            self.prospect.city,
            "Paris",
        )

        self.assertEqual(
            self.prospect.phone,
            "0699887766",
        )

    def test_employee_can_change_prospect_status(self):
        response = self.api_client.patch(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/status/"
            ),
            {
                "status":
                    Prospect.Status.CONTACTED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.prospect.refresh_from_db()

        self.assertEqual(
            self.prospect.status,
            Prospect.Status.CONTACTED,
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def test_employee_can_convert_prospect_to_client(
        self,
        mocked_send_email,
    ):
        mocked_send_email.return_value = None

        response = self.api_client.post(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/convert/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        client_user = User.objects.get(
            email=self.prospect.email
        )

        self.assertEqual(
            client_user.role,
            User.Role.CLIENT,
        )

        self.assertFalse(
            client_user.is_staff
        )

        self.assertFalse(
            client_user.is_superuser
        )

        self.assertFalse(
            client_user.email_verified
        )

        self.assertFalse(
            client_user.has_usable_password()
        )

        profile = ClientProfile.objects.get(
            user=client_user
        )

        self.assertEqual(
            profile.company,
            self.prospect.company,
        )

        self.assertEqual(
            profile.phone,
            self.prospect.phone,
        )

        self.prospect.refresh_from_db()

        self.assertEqual(
            self.prospect.converted_client_id,
            client_user.id,
        )

        self.assertEqual(
            self.prospect.status,
            Prospect.Status.QUALIFIED,
        )

    def test_employee_can_create_quote_for_prospect(self):
        response = self.api_client.post(
            "/api/quotes/",
            {
                "prospect":
                    self.prospect.id,
                "tva_rate":
                    "0.20",
                "items": [
                    {
                        "label":
                            "Organisation événement",
                        "amount_ht":
                            "1500.00",
                    },
                    {
                        "label":
                            "Prestation technique",
                        "amount_ht":
                            "500.00",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        quote = Quote.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            quote.prospect_id,
            self.prospect.id,
        )

        self.assertEqual(
            quote.status,
            Quote.Status.DRAFT,
        )

        self.assertEqual(
            QuoteItem.objects.filter(
                quote=quote
            ).count(),
            2,
        )

        self.assertEqual(
            str(quote.total_ht),
            "2000.00",
        )

        self.assertEqual(
            str(quote.total_tva),
            "400.00",
        )

        self.assertEqual(
            str(quote.total_ttc),
            "2400.00",
        )

    def test_employee_can_update_quote(self):
        quote = Quote.objects.create(
            prospect=self.prospect,
            tva_rate="0.20",
        )

        response = self.api_client.patch(
            (
                f"/api/quotes/"
                f"{quote.id}/"
            ),
            {
                "tva_rate": "0.10",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        quote.refresh_from_db()

        self.assertEqual(
            str(quote.tva_rate),
            "0.10",
        )

    def test_employee_cannot_delete_prospect(self):
        response = self.api_client.delete(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Prospect.objects.filter(
                pk=self.prospect.id
            ).exists()
        )

    def test_employee_cannot_delete_quote(self):
        quote = Quote.objects.create(
            prospect=self.prospect,
        )

        response = self.api_client.delete(
            (
                f"/api/quotes/"
                f"{quote.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Quote.objects.filter(
                pk=quote.id
            ).exists()
        )

    def test_employee_can_generate_quote_pdf(self):
        quote = Quote.objects.create(
            prospect=self.prospect,
            tva_rate="0.20",
        )

        QuoteItem.objects.create(
            quote=quote,
            label="Organisation événement",
            amount_ht="1500.00",
        )

        response = self.api_client.get(
            (
                f"/api/quotes/"
                f"{quote.id}/pdf/"
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response["Content-Type"],
            "application/pdf",
        )

        self.assertIn(
            (
                f'devis_{quote.id}.pdf'
            ),
            response["Content-Disposition"],
        )

        self.assertTrue(
            response.content.startswith(
                b"%PDF"
            )
        )
