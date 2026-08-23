from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from .models import VerificationCode
from .services import (
    check_account_activation_token,
    create_account_activation_token,
)


User = get_user_model()


class AccountActivationTest(TestCase):
    def setUp(self):
        cache.clear()

        self.client = APIClient()

        self.user = User.objects.create_user(
            username="activation_client",
            email="activation@test.local",
            password=None,
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=False,
        )

    def test_activation_token_is_hashed_and_valid_for_24_hours(self):
        raw_token, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        self.assertEqual(
            activation_token.purpose,
            VerificationCode.Purpose.ACCOUNT_ACTIVATION,
        )

        self.assertNotEqual(
            raw_token,
            activation_token.code_hash,
        )

        self.assertTrue(
            check_password(
                raw_token,
                activation_token.code_hash,
            )
        )

        remaining_time = (
            activation_token.expires_at
            - timezone.now()
        )

        self.assertGreater(
            remaining_time,
            timedelta(
                hours=23,
                minutes=59,
            ),
        )

    def test_new_activation_token_invalidates_previous_token(self):
        first_token, first_object = (
            create_account_activation_token(
                self.user
            )
        )

        second_token, _ = (
            create_account_activation_token(
                self.user
            )
        )

        first_object.refresh_from_db()

        self.assertIsNotNone(
            first_object.used_at
        )

        first_valid, _ = (
            check_account_activation_token(
                self.user,
                first_token,
                consume=False,
            )
        )

        self.assertFalse(
            first_valid
        )

        second_valid, _ = (
            check_account_activation_token(
                self.user,
                second_token,
                consume=False,
            )
        )

        self.assertTrue(
            second_valid
        )

    def test_valid_activation_sets_password_and_verifies_email(self):
        raw_token, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": raw_token,
                "password": (
                    "ActivationPassword123!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["username"],
            self.user.username,
        )

        self.user.refresh_from_db()
        activation_token.refresh_from_db()

        self.assertTrue(
            self.user.email_verified
        )

        self.assertTrue(
            self.user.has_usable_password()
        )

        self.assertTrue(
            self.user.check_password(
                "ActivationPassword123!"
            )
        )

        self.assertFalse(
            self.user.is_staff
        )

        self.assertFalse(
            self.user.is_superuser
        )

        self.assertIsNotNone(
            activation_token.used_at
        )

    def test_invalid_activation_token_is_refused(self):
        _, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": "invalid-token",
                "password": (
                    "ActivationPassword123!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.user.refresh_from_db()
        activation_token.refresh_from_db()

        self.assertFalse(
            self.user.email_verified
        )

        self.assertFalse(
            self.user.has_usable_password()
        )

        self.assertIsNone(
            activation_token.used_at
        )

    def test_expired_activation_token_is_refused(self):
        raw_token, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        activation_token.expires_at = (
            timezone.now()
            - timedelta(minutes=1)
        )

        activation_token.save(
            update_fields=[
                "expires_at",
            ]
        )

        response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": raw_token,
                "password": (
                    "ActivationPassword123!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.user.refresh_from_db()
        activation_token.refresh_from_db()

        self.assertFalse(
            self.user.email_verified
        )

        self.assertFalse(
            self.user.has_usable_password()
        )

        self.assertIsNotNone(
            activation_token.used_at
        )

    def test_weak_password_does_not_consume_activation_token(self):
        raw_token, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": raw_token,
                "password": "123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "password",
            response.data,
        )

        self.user.refresh_from_db()
        activation_token.refresh_from_db()

        self.assertFalse(
            self.user.email_verified
        )

        self.assertFalse(
            self.user.has_usable_password()
        )

        self.assertIsNone(
            activation_token.used_at
        )

    def test_activation_token_cannot_be_reused(self):
        raw_token, activation_token = (
            create_account_activation_token(
                self.user
            )
        )

        first_response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": raw_token,
                "password": (
                    "ActivationPassword123!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            200,
        )

        second_response = self.client.post(
            "/api/activate-account/",
            {
                "uid": self.user.id,
                "token": raw_token,
                "password": (
                    "AnotherPassword123!"
                ),
            },
            format="json",
        )

        self.assertEqual(
            second_response.status_code,
            400,
        )

        self.user.refresh_from_db()
        activation_token.refresh_from_db()

        self.assertTrue(
            self.user.check_password(
                "ActivationPassword123!"
            )
        )

        self.assertFalse(
            self.user.check_password(
                "AnotherPassword123!"
            )
        )

        self.assertIsNotNone(
            activation_token.used_at
        )

    def test_account_activation_is_throttled(self):
        cache.clear()

        raw_token, _ = (
            create_account_activation_token(
                self.user
            )
        )

        statuses = []

        for _ in range(11):
            response = self.client.post(
                "/api/activate-account/",
                {
                    "uid": self.user.id,
                    "token": (
                        raw_token
                        + "-invalid"
                    ),
                    "password": (
                        "ActivationPassword123!"
                    ),
                },
                format="json",
                REMOTE_ADDR="10.10.0.8",
            )

            statuses.append(
                response.status_code
            )

        self.assertEqual(
            statuses[-1],
            429,
        )