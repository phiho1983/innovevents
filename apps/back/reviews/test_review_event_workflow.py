from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event
from reviews.models import Review


User = get_user_model()


class ReviewEventWorkflowTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="review_event_admin",
            password="TestPassword123!",
            role=User.Role.ADMIN,
        )

        self.client_user = User.objects.create_user(
            username="review_event_client",
            password="TestPassword123!",
            role=User.Role.CLIENT,
        )

        self.other_client = User.objects.create_user(
            username="review_event_other_client",
            password="TestPassword123!",
            role=User.Role.CLIENT,
        )

        self.event = Event.objects.create(
            title="Événement client terminé",
            description="Événement privé destiné au test des avis.",
            city="Paris",
            start_at=timezone.now() - timedelta(days=2),
            end_at=timezone.now() - timedelta(days=1),
            capacity=50,
            event_type=Event.EventType.CONFERENCE,
            status=Event.Status.DONE,
            visible=False,
            organizer=self.admin,
            client=self.client_user,
        )

    def api_for(self, user):
        client = APIClient()

        client.force_authenticate(
            user=user
        )

        return client

    def test_client_can_review_own_done_event(self):
        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": self.event.id,
                "rating": 5,
                "content": (
                    "Très bonne organisation pour notre événement."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        created_review = Review.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            created_review.author,
            self.client_user,
        )

        self.assertEqual(
            created_review.event,
            self.event,
        )

        self.assertEqual(
            created_review.rating,
            5,
        )

        self.assertEqual(
            created_review.content,
            "Très bonne organisation pour notre événement.",
        )

    def test_client_cannot_review_own_draft_event(self):
        draft_event = Event.objects.create(
            title="Événement client en brouillon",
            description="Événement privé non terminé.",
            city="Paris",
            start_at=timezone.now() + timedelta(days=10),
            end_at=timezone.now() + timedelta(days=11),
            capacity=40,
            event_type=Event.EventType.SEMINAR,
            status=Event.Status.DRAFT,
            visible=False,
            organizer=self.admin,
            client=self.client_user,
        )

        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": draft_event.id,
                "rating": 4,
                "content": (
                    "Cet avis ne doit pas pouvoir être enregistré."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertFalse(
            Review.objects.filter(
                event=draft_event
            ).exists()
        )

    def test_client_cannot_review_another_clients_done_event(self):
        other_client_event = Event.objects.create(
            title="Événement terminé d'un autre client",
            description="Événement privé appartenant à un autre client.",
            city="Lyon",
            start_at=timezone.now() - timedelta(days=4),
            end_at=timezone.now() - timedelta(days=3),
            capacity=60,
            event_type=Event.EventType.PARTY,
            status=Event.Status.DONE,
            visible=False,
            organizer=self.admin,
            client=self.other_client,
        )

        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": other_client_event.id,
                "rating": 5,
                "content": (
                    "Je ne dois pas pouvoir commenter cet événement."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertFalse(
            Review.objects.filter(
                event=other_client_event
            ).exists()
        )

    def test_client_cannot_review_same_event_twice(self):
        Review.objects.create(
            event=self.event,
            author=self.client_user,
            rating=5,
            content=(
                "Premier avis publié pour cet événement terminé."
            ),
        )

        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": self.event.id,
                "rating": 4,
                "content": (
                    "Deuxième avis qui doit être refusé par l'API."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            Review.objects.filter(
                event=self.event
            ).count(),
            1,
        )

    def test_client_cannot_review_showcase_event(self):
        showcase_event = Event.objects.create(
            title="Événement vitrine public",
            description="Événement destiné uniquement à la vitrine publique.",
            city="Bordeaux",
            start_at=timezone.now() - timedelta(days=6),
            end_at=timezone.now() - timedelta(days=5),
            capacity=100,
            event_type=Event.EventType.CONFERENCE,
            status=Event.Status.DONE,
            visible=True,
            client_agreed=True,
            organizer=self.admin,
            client=None,
        )

        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": showcase_event.id,
                "rating": 5,
                "content": (
                    "Un événement vitrine ne doit pas recevoir cet avis."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertFalse(
            Review.objects.filter(
                event=showcase_event
            ).exists()
        )

    def test_public_review_list_does_not_expose_private_event(self):
        Review.objects.create(
            event=self.event,
            author=self.client_user,
            rating=5,
            content=(
                "Avis public sans exposition du dossier événement privé."
            ),
        )

        client = APIClient()

        response = client.get(
            "/api/reviews/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        reviews = (
            response.data
            if isinstance(response.data, list)
            else response.data.get("results", [])
        )

        self.assertEqual(
            len(reviews),
            1,
        )

        self.assertNotIn(
            "event",
            reviews[0],
        )
