from unittest.mock import patch

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    ClientProfile,
    Prospect,
    Quote,
)


User = get_user_model()


class QuoteSendWorkflowTests(
    APITestCase
):
    def setUp(self):
        self.employee = (
            User.objects.create_user(
                username="quote_sender",
                email="sender@example.com",
                password="EmployeePassword123!",
                role=User.Role.EMPLOYEE,
                email_verified=True,
            )
        )

        self.client_user = (
            User.objects.create_user(
                username="existing_client",
                email="existing@example.com",
                password="ClientPassword123!",
                role=User.Role.CLIENT,
                email_verified=True,
            )
        )

    def create_prospect(
        self,
        email="prospect@example.com",
    ):
        return Prospect.objects.create(
            first_name="Jean",
            last_name="Dupont",
            email=email,
            phone="",
            company="",
            city="",
            message="Projet événementiel.",
        )

    def create_quote(
        self,
        prospect=None,
        client=None,
    ):
        return Quote.objects.create(
            prospect=prospect,
            client=client,
            status=Quote.Status.DRAFT,
        )

    @patch(
        "crm.views.send_transactional_email"
    )
    def test_employee_can_send_quote_and_create_client(
        self,
        mocked_send_email,
    ):
        prospect = (
            self.create_prospect()
        )

        quote = (
            self.create_quote(
                prospect=prospect
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        quote.refresh_from_db()
        prospect.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

        self.assertIsNotNone(
            quote.client_id
        )

        self.assertEqual(
            prospect.converted_client_id,
            quote.client_id,
        )

        self.assertEqual(
            prospect.status,
            Prospect.Status.QUALIFIED,
        )

        client = quote.client

        self.assertEqual(
            client.role,
            User.Role.CLIENT,
        )

        self.assertEqual(
            client.email,
            prospect.email,
        )

        self.assertFalse(
            client.email_verified
        )

        self.assertTrue(
            ClientProfile.objects.filter(
                user=client
            ).exists()
        )

        mocked_send_email.assert_called_once()

    def test_existing_client_is_reused(
        self,
    ):
        prospect = (
            self.create_prospect(
                email=
                    self.client_user.email
            )
        )

        quote = (
            self.create_quote(
                prospect=prospect
            )
        )

        before_count = (
            User.objects.count()
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        quote.refresh_from_db()
        prospect.refresh_from_db()

        self.assertEqual(
            quote.client,
            self.client_user,
        )

        self.assertEqual(
            prospect.converted_client,
            self.client_user,
        )

        self.assertEqual(
            User.objects.count(),
            before_count,
        )

    def test_send_is_idempotent_for_client_creation(
        self,
    ):
        prospect = (
            self.create_prospect()
        )

        quote = (
            self.create_quote(
                prospect=prospect
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        first_response = (
            self.client.post(
                f"/api/quotes/{quote.id}/send/",
                {},
                format="json",
            )
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        client_count = (
            User.objects.filter(
                role=User.Role.CLIENT
            ).count()
        )

        second_response = (
            self.client.post(
                f"/api/quotes/{quote.id}/send/",
                {},
                format="json",
            )
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            User.objects.filter(
                role=User.Role.CLIENT
            ).count(),
            client_count,
        )

    def test_client_cannot_send_quote(
        self,
    ):
        quote = (
            self.create_quote(
                client=self.client_user
            )
        )

        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_quote_without_recipient_cannot_be_sent(
        self,
    ):
        quote = (
            self.create_quote()
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.DRAFT,
        )

    def test_final_quote_cannot_be_sent_again(
        self,
    ):
        quote = Quote.objects.create(
            client=self.client_user,
            status=Quote.Status.ACCEPTED,
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.ACCEPTED,
        )