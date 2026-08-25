from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import (
    Note,
    Quote,
)


User = get_user_model()


class QuoteDecisionTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="quote_decision_admin",
            email="quote.decision.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.employee = User.objects.create_user(
            username="quote_decision_employee",
            email="quote.decision.employee@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="quote_decision_client",
            email="quote.decision.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,

            # volontaire :
            # is_staff ne doit donner ni retirer
            # aucun droit métier.
            is_staff=True,

            is_superuser=False,
            email_verified=True,
        )

        self.other_client = User.objects.create_user(
            username="quote_decision_other_client",
            email="quote.decision.other@test.local",
            password="OtherClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

    def create_sent_quote(self):
        return Quote.objects.create(
            client=self.client_user,
            status=Quote.Status.SENT,
        )

    def test_client_can_accept_own_sent_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.ACCEPTED,
        )

    def test_client_can_refuse_own_sent_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/refuse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.REFUSED,
        )

    def test_client_can_request_change_on_own_sent_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.client_user
        )

        reason = (
            "Merci de modifier "
            "la prestation technique."
        )

        response = self.api_client.post(
            (
                f"/api/quotes/"
                f"{quote.id}/request-change/"
            ),
            {
                "reason": reason,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.CHANGE_REQUESTED,
        )

        note = Note.objects.get(
            client=self.client_user
        )

        self.assertEqual(
            note.author,
            self.client_user,
        )

        self.assertIn(
            reason,
            note.content,
        )

    def test_other_client_cannot_decide_on_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.other_client
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

    def test_employee_cannot_decide_on_client_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.employee
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

    def test_admin_cannot_decide_on_client_quote(self):
        quote = self.create_sent_quote()

        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

    def test_unauthenticated_user_cannot_decide_on_quote(self):
        quote = self.create_sent_quote()

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            401,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

    def test_draft_quote_cannot_be_accepted(self):
        quote = Quote.objects.create(
            client=self.client_user,
            status=Quote.Status.DRAFT,
        )

        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.DRAFT,
        )

    def test_final_decision_cannot_be_changed(self):
        quote = Quote.objects.create(
            client=self.client_user,
            status=Quote.Status.ACCEPTED,
        )

        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            f"/api/quotes/{quote.id}/refuse/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.ACCEPTED,
        )