from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import Review


User = get_user_model()


class GeneralReviewWorkflowTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.client_user = User.objects.create_user(
            username="general_review_client",
            email="general.review.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            email_verified=True,
        )

    def test_client_can_publish_general_review_without_event(self):
        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            "/api/reviews/",
            {
                "rating": 5,
                "content": (
                    "Une équipe très professionnelle "
                    "et un excellent accompagnement."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        review = Review.objects.get()

        self.assertEqual(
            review.author,
            self.client_user,
        )

        self.assertEqual(
            review.rating,
            5,
        )

        self.assertEqual(
            review.content,
            (
                "Une équipe très professionnelle "
                "et un excellent accompagnement."
            ),
        )