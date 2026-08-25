from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event

from .models import Quote


User = get_user_model()


class QuoteEventStatusTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="event_status_admin",
            email="event.status.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="event_status_client",
            email="event.status.client@test.local",
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
            title="CLIENT EVENT STATUS TEST",
            city="Paris",
            start_at=start_at,
            end_at=(
                start_at
                + timedelta(hours=4)
            ),
            capacity=50,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.DRAFT,
            visible=False,
            client_agreed=False,
        )

        self.api_client.force_authenticate(
            user=self.client_user
        )

    def create_sent_quote(self):
        return Quote.objects.create(
            client=self.client_user,
            event=self.event,
            status=Quote.Status.SENT,
        )

    def test_accepting_quote_accepts_linked_event(self):
        quote = self.create_sent_quote()

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
        self.event.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.ACCEPTED,
        )

        self.assertEqual(
            self.event.status,
            Event.Status.ACCEPTED,
        )

    def test_refusing_quote_does_not_accept_event(self):
        quote = self.create_sent_quote()

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
        self.event.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.REFUSED,
        )

        self.assertEqual(
            self.event.status,
            Event.Status.DRAFT,
        )

    def test_requesting_change_does_not_accept_event(self):
        quote = self.create_sent_quote()

        response = self.api_client.post(
            (
                f"/api/quotes/"
                f"{quote.id}/request-change/"
            ),
            {
                "reason": (
                    "Merci de modifier "
                    "la prestation."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        quote.refresh_from_db()
        self.event.refresh_from_db()

        self.assertEqual(
            quote.status,
            Quote.Status.CHANGE_REQUESTED,
        )

        self.assertEqual(
            self.event.status,
            Event.Status.DRAFT,
        )