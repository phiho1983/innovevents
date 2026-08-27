from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

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