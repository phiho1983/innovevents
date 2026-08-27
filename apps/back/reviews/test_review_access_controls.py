from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event
from reviews.models import Review


User = get_user_model()


class ReviewAccessControlTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="review_access_admin",
            password="TestPassword123!",
            role=User.Role.ADMIN,
        )

        self.client_user = User.objects.create_user(
            username="review_access_client",
            password="TestPassword123!",
            role=User.Role.CLIENT,
        )

        self.event = Event.objects.create(
            title="Événement terminé pour contrôle des avis",
            description="Événement privé utilisé pour les tests d'accès.",
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

    def test_admin_cannot_create_review(self):
        client = self.api_for(
            self.admin
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": self.event.id,
                "rating": 5,
                "content": (
                    "Un administrateur ne doit pas publier cet avis."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertEqual(
            Review.objects.count(),
            0,
        )

    def test_visitor_cannot_create_review(self):
        client = APIClient()

        response = client.post(
            "/api/reviews/",
            {
                "event": self.event.id,
                "rating": 5,
                "content": (
                    "Un visiteur non connecté ne doit pas publier cet avis."
                ),
            },
            format="json",
        )

        self.assertIn(
            response.status_code,
            (401, 403),
        )

        self.assertEqual(
            Review.objects.count(),
            0,
        )

    def test_client_cannot_patch_review(self):
        review = Review.objects.create(
            event=self.event,
            author=self.client_user,
            rating=5,
            content="Avis initial qui ne doit pas être modifiable.",
        )

        client = self.api_for(
            self.client_user
        )

        response = client.patch(
            f"/api/reviews/{review.id}/",
            {
                "rating": 1,
                "content": "Tentative de modification de l'avis.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        review.refresh_from_db()

        self.assertEqual(
            review.rating,
            5,
        )

        self.assertEqual(
            review.content,
            "Avis initial qui ne doit pas être modifiable.",
        )

    def test_admin_cannot_put_review(self):
        review = Review.objects.create(
            event=self.event,
            author=self.client_user,
            rating=5,
            content="Avis initial qui ne doit pas être modifiable.",
        )

        client = self.api_for(
            self.admin
        )

        response = client.put(
            f"/api/reviews/{review.id}/",
            {
                "event": self.event.id,
                "rating": 1,
                "content": "Tentative de remplacement complet de l'avis.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            405,
        )

        review.refresh_from_db()

        self.assertEqual(
            review.rating,
            5,
        )

        self.assertEqual(
            review.content,
            "Avis initial qui ne doit pas être modifiable.",
        )
