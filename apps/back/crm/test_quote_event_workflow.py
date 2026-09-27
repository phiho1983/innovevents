from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event

from .models import Quote


User = get_user_model()


class QuoteEventWorkflowTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="workflow_admin",
            email="workflow.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="workflow_client",
            email="workflow.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        start_at = (
            timezone.now()
            + timedelta(days=30)
        )

        self.event = Event.objects.create(
            title="WORKFLOW PRIVATE EVENT",
            city="Marseille",
            start_at=start_at,
            end_at=(
                start_at
                + timedelta(hours=4)
            ),
            capacity=100,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.DRAFT,
            visible=False,
            client_agreed=False,
        )

    def test_complete_quote_event_workflow(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        create_response = self.api_client.post(
            "/api/quotes/",
            {
                "event": self.event.id,
                "tva_rate": "0.20",
                "items": [
                    {
                        "label":
                            "Organisation événement",
                        "amount_ht":
                            "2500.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(
            create_response.status_code,
            201,
        )

        quote = Quote.objects.get(
            pk=create_response.data["id"]
        )

        self.assertEqual(
            quote.status,
            Quote.Status.DRAFT,
        )

        self.assertEqual(
            quote.event_id,
            self.event.id,
        )

        self.assertEqual(
            quote.client_id,
            self.client_user.id,
        )

        send_response = self.api_client.post(
            f"/api/quotes/{quote.id}/send/",
            {},
            format="json",
        )

        self.assertEqual(
            send_response.status_code,
            200,
        )

        quote.refresh_from_db()
        self.event.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.SENT,
        )

        self.assertEqual(
            self.event.status,
            Event.Status.DRAFT,
        )

        self.api_client.force_authenticate(
            user=self.client_user
        )

        accept_response = self.api_client.post(
            f"/api/quotes/{quote.id}/accept/",
            {},
            format="json",
        )

        self.assertEqual(
            accept_response.status_code,
            200,
        )

        quote.refresh_from_db()
        self.event.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.ACCEPTED,
        )

        self.assertEqual(
            self.event.status,
            Event.Status.ACCEPTED,
        )

        self.api_client.force_authenticate(
            user=self.admin
        )

        start_response = self.api_client.post(
            f"/api/events/{self.event.id}/start/",
            {},
            format="json",
        )

        self.assertEqual(
            start_response.status_code,
            200,
        )

        self.event.refresh_from_db()

        self.assertEqual(
            self.event.status,
            Event.Status.IN_PROGRESS,
        )

        complete_response = self.api_client.post(
            f"/api/events/{self.event.id}/complete/",
            {},
            format="json",
        )

        self.assertEqual(
            complete_response.status_code,
            200,
        )

        self.event.refresh_from_db()

        self.assertEqual(
            self.event.status,
            Event.Status.DONE,
        )