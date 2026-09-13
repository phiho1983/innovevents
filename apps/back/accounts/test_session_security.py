from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from rest_framework_simplejwt.tokens import (
    RefreshToken,
)


User = get_user_model()


class PasswordChangeSecurityTests(
    APITestCase
):
    def setUp(self):
        self.user = User.objects.create_user(
            username="security_user",
            email="security@example.com",
            password="OldPassword123!",
            email_verified=True,
        )

        self.client.force_authenticate(
            user=self.user
        )

    def test_change_password_requires_current_password(
        self,
    ):
        response = self.client.post(
            "/api/change-password/",
            {
                "password":
                    "NewPassword456!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "current_password",
            response.data,
        )

    def test_change_password_rejects_wrong_current_password(
        self,
    ):
        response = self.client.post(
            "/api/change-password/",
            {
                "current_password":
                    "WrongPassword999!",
                "password":
                    "NewPassword456!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                "OldPassword123!"
            )
        )

    def test_change_password_accepts_correct_current_password(
        self,
    ):
        response = self.client.post(
            "/api/change-password/",
            {
                "current_password":
                    "OldPassword123!",
                "password":
                    "NewPassword456!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.user.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                "NewPassword456!"
            )
        )


class LogoutSecurityTests(
    APITestCase
):
    def setUp(self):
        self.user = User.objects.create_user(
            username="logout_user",
            email="logout@example.com",
            password="LogoutPassword123!",
            email_verified=True,
        )

    def test_logout_blacklists_refresh_token(
        self,
    ):
        refresh = RefreshToken.for_user(
            self.user
        )

        access = str(
            refresh.access_token
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {access}"
            )
        )

        response = self.client.post(
            "/api/logout/",
            {
                "refresh":
                    str(refresh),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.client.credentials()

        refresh_response = (
            self.client.post(
                "/api/token/refresh/",
                {
                    "refresh":
                        str(refresh),
                },
                format="json",
            )
        )

        self.assertEqual(
            refresh_response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_logout_requires_refresh_token(
        self,
    ):
        refresh = RefreshToken.for_user(
            self.user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                "Bearer "
                f"{refresh.access_token}"
            )
        )

        response = self.client.post(
            "/api/logout/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )