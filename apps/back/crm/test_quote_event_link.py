from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event

from .models import Quote


User = get_user_model()


class QuoteEventLinkTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="quote_event_admin",
            email="quote.event.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="quote_event_client",
            email="quote.event.client@test.local",
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
            title="PRIVATE CLIENT EVENT",
            city="Lyon",
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
            user=self.admin
        )

    def test_quote_created_for_event_is_linked_to_event_and_client(
        self,
    ):
        response = self.api_client.post(
            "/api/quotes/",
            {
                "event": self.event.id,
                "tva_rate": "0.20",
                "items": [
                    {
                        "label": "Organisation événement",
                        "amount_ht": "2500.00",
                    }
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
            quote.event_id,
            self.event.id,
        )

        self.assertEqual(
            quote.client_id,
            self.client_user.id,
        )

    def test_client_can_list_quote_linked_to_own_event(
        self,
    ):
        response = self.api_client.post(
            "/api/quotes/",
            {
                "event": self.event.id,
                "tva_rate": "0.20",
                "items": [
                    {
                        "label": "Prestation technique",
                        "amount_ht": "1800.00",
                    }
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

        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.get(
            "/api/quotes/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        results = response.data.get(
            "results",
            response.data,
        )

        quote_ids = [
            result["id"]
            for result in results
        ]

        self.assertIn(
            quote.id,
            quote_ids,
        )