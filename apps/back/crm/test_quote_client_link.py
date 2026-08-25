from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase

from rest_framework.test import APIClient

from .models import (
    Prospect,
    Quote,
)


User = get_user_model()


class QuoteClientLinkTest(TestCase):
    def setUp(self):
        cache.clear()

        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="quote_admin",
            email="quote.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.prospect = Prospect.objects.create(
            first_name="Sophie",
            last_name="Bernard",
            email="sophie.bernard@test.local",
            phone="0611223344",
            company="Horizon",
            city="Lyon",
            message=(
                "Organisation d'un événement "
                "professionnel."
            ),
        )

        self.api_client.force_authenticate(
            user=self.admin
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def convert_prospect(
        self,
        mocked_send_email,
    ):
        mocked_send_email.return_value = None

        return self.api_client.post(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/convert/"
            ),
            {},
            format="json",
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def test_conversion_links_prospect_and_existing_quote_to_client(
        self,
        mocked_send_email,
    ):
        quote = Quote.objects.create(
            prospect=self.prospect,
        )

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

        self.prospect.refresh_from_db()
        quote.refresh_from_db()

        self.assertEqual(
            self.prospect.converted_client_id,
            client_user.id,
        )

        self.assertEqual(
            quote.client_id,
            client_user.id,
        )

        self.assertEqual(
            quote.prospect_id,
            self.prospect.id,
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def test_quote_created_after_conversion_is_linked_to_client(
        self,
        mocked_send_email,
    ):
        mocked_send_email.return_value = None

        conversion_response = (
            self.api_client.post(
                (
                    f"/api/prospects/"
                    f"{self.prospect.id}/convert/"
                ),
                {},
                format="json",
            )
        )

        self.assertEqual(
            conversion_response.status_code,
            201,
        )

        quote_response = (
            self.api_client.post(
                "/api/quotes/",
                {
                    "prospect":
                        self.prospect.id,
                    "tva_rate":
                        "0.20",
                    "items": [
                        {
                            "label":
                                "Organisation",
                            "amount_ht":
                                "1000.00",
                        }
                    ],
                },
                format="json",
            )
        )

        self.assertEqual(
            quote_response.status_code,
            201,
        )

        quote = Quote.objects.get(
            pk=quote_response.data["id"]
        )

        client_user = User.objects.get(
            email=self.prospect.email
        )

        self.assertEqual(
            quote.client_id,
            client_user.id,
        )

        self.assertEqual(
            quote.prospect_id,
            self.prospect.id,
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def test_converted_client_can_list_existing_quote(
        self,
        mocked_send_email,
    ):
        quote = Quote.objects.create(
            prospect=self.prospect,
        )

        mocked_send_email.return_value = None

        conversion_response = (
            self.api_client.post(
                (
                    f"/api/prospects/"
                    f"{self.prospect.id}/convert/"
                ),
                {},
                format="json",
            )
        )

        self.assertEqual(
            conversion_response.status_code,
            201,
        )

        client_user = User.objects.get(
            email=self.prospect.email
        )

        self.api_client.force_authenticate(
            user=client_user
        )

        response = self.api_client.get(
            "/api/quotes/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        results = (
            response.data.get(
                "results",
                response.data,
            )
        )

        quote_ids = [
            result["id"]
            for result in results
        ]

        self.assertIn(
            quote.id,
            quote_ids,
        )