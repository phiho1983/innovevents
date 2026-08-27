from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event

from .models import Review


User = get_user_model()


class ReviewAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="review_admin_test",
            password="TestPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.employee = User.objects.create_user(
            username="review_employee_test",
            password="TestPassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
        )

        self.client_user = User.objects.create_user(
            username="review_client_test",
            password="TestPassword123!",
            role=User.Role.CLIENT,

            # volontaire pour tester
            # l'indépendance de is_staff
            is_staff=True,
        )

        self.review_event = Event.objects.create(
            title="Événement terminé avec avis",
            description="Événement privé utilisé pour les tests des avis.",
            city="Paris",
            start_at=timezone.now() - timedelta(days=4),
            end_at=timezone.now() - timedelta(days=3),
            capacity=50,
            event_type=Event.EventType.CONFERENCE,
            status=Event.Status.DONE,
            visible=False,
            organizer=self.admin,
            client=self.client_user,
        )

        self.create_event = Event.objects.create(
            title="Événement terminé sans avis",
            description="Événement privé disponible pour créer un avis.",
            city="Lyon",
            start_at=timezone.now() - timedelta(days=2),
            end_at=timezone.now() - timedelta(days=1),
            capacity=40,
            event_type=Event.EventType.SEMINAR,
            status=Event.Status.DONE,
            visible=False,
            organizer=self.admin,
            client=self.client_user,
        )

        self.review = Review.objects.create(
            event=self.review_event,
            author=self.client_user,
            rating=5,
            content=(
                "Excellent événement et très bonne organisation."
            ),
        )

    def api_for(self, user):
        client = APIClient()

        client.force_authenticate(
            user=user
        )

        return client

    def test_visitor_can_list_reviews(self):
        client = APIClient()

        response = client.get(
            "/api/reviews/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_client_can_create_review(self):
        client = self.api_for(
            self.client_user
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": self.create_event.id,
                "rating": 4,
                "content": (
                    "Très bonne prestation pour notre événement."
                ),

                # tentative d'injection d'auteur
                "author": self.admin.id,
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
            self.create_event,
        )

    def test_employee_cannot_create_review(self):
        client = self.api_for(
            self.employee
        )

        response = client.post(
            "/api/reviews/",
            {
                "event": self.create_event.id,
                "rating": 5,
                "content": (
                    "Un commentaire suffisamment long."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_client_with_is_staff_cannot_delete_review(self):
        client = self.api_for(
            self.client_user
        )

        response = client.delete(
            f"/api/reviews/{self.review.id}/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_employee_cannot_delete_review(self):
        client = self.api_for(
            self.employee
        )

        response = client.delete(
            f"/api/reviews/{self.review.id}/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_admin_without_is_staff_can_delete_review(self):
        client = self.api_for(
            self.admin
        )

        response = client.delete(
            f"/api/reviews/{self.review.id}/"
        )

        self.assertEqual(
            response.status_code,
            204,
        )

        self.assertFalse(
            Review.objects.filter(
                pk=self.review.id
            ).exists()
        )