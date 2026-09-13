from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from rest_framework_simplejwt.tokens import (
    RefreshToken,
)

from .models import VerificationCode
from .services import create_verification_code


User = get_user_model()


class PasswordTokenRevocationTests(
    APITestCase
):
    def setUp(self):
        self.user = User.objects.create_user(
            username="token_revocation_user",
            email="token-revocation@example.com",
            password="OldPassword123!",
            email_verified=True,
        )

    def issue_tokens(self):
        refresh = RefreshToken.for_user(
            self.user
        )

        access = str(
            refresh.access_token
        )

        return refresh, access

    def authenticate_with_access(
        self,
        access,
    ):
        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {access}"
            )
        )

    def perform_password_change(
        self,
        access,
    ):
        self.authenticate_with_access(
            access
        )

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

        self.client.credentials()

    def perform_password_reset(self):
        code, _ = create_verification_code(
            self.user,
            VerificationCode.Purpose.PASSWORD_RESET,
        )

        self.client.credentials()

        response = self.client.post(
            "/api/reset-password/",
            {
                "email":
                    self.user.email,
                "code":
                    code,
                "password":
                    "ResetPassword456!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_change_password_invalidates_existing_access_token(
        self,
    ):
        refresh, access = self.issue_tokens()

        self.perform_password_change(
            access
        )

        self.authenticate_with_access(
            access
        )

        response = self.client.get(
            "/api/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_change_password_invalidates_existing_refresh_token(
        self,
    ):
        refresh, access = self.issue_tokens()

        self.perform_password_change(
            access
        )

        response = self.client.post(
            "/api/token/refresh/",
            {
                "refresh":
                    str(refresh),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_reset_password_invalidates_existing_access_token(
        self,
    ):
        refresh, access = self.issue_tokens()

        self.perform_password_reset()

        self.authenticate_with_access(
            access
        )

        response = self.client.get(
            "/api/me/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_reset_password_invalidates_existing_refresh_token(
        self,
    ):
        refresh, access = self.issue_tokens()

        self.perform_password_reset()

        response = self.client.post(
            "/api/token/refresh/",
            {
                "refresh":
                    str(refresh),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
