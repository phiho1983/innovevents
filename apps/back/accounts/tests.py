

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase

from rest_framework.test import APIClient

from .models import VerificationCode
from .services import (
    create_verification_code,
    check_verification_code,
)


User = get_user_model()


class AccountsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.client_verified = User.objects.create_user(
            username="client_verified",
            email="verified@test.local",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            email_verified=True,
        )

        self.client_unverified = User.objects.create_user(
            username="client_unverified",
            email="unverified@test.local",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            email_verified=False,
        )

        self.admin = User.objects.create_superuser(
            username="admin_test",
            email="admin@test.local",
            password="AdminPassword123!",
        )

        self.admin.role = User.Role.ADMIN
        self.admin.email_verified = True
        self.admin.is_staff = True
        self.admin.is_superuser = True

        self.admin.save(
            update_fields=[
                "role",
                "email_verified",
                "is_staff",
                "is_superuser",
            ]
        )

    # ==========================================================
    # JWT
    # ==========================================================

    def test_login_refused_if_email_not_verified(self):
        response = self.client.post(
            "/api/login/",
            {
                "username": "client_unverified",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

        self.assertNotIn(
            "access",
            response.data,
        )

        self.assertNotIn(
            "refresh",
            response.data,
        )

    def test_login_allowed_if_email_verified(self):
        response = self.client.post(
            "/api/login/",
            {
                "username": "client_verified",
                "password": "TestPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertIn(
            "access",
            response.data,
        )

        self.assertIn(
            "refresh",
            response.data,
        )

    def test_admin_login_allowed(self):
        response = self.client.post(
            "/api/login/",
            {
                "username": "admin_test",
                "password": "AdminPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertIn(
            "access",
            response.data,
        )

        self.assertIn(
            "refresh",
            response.data,
        )

    # ==========================================================
    # EMAIL VERIFICATION
    # ==========================================================

    def test_verify_email_with_valid_code(self):
        code, _ = create_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
        )

        response = self.client.post(
            "/api/verify-email/",
            {
                "email": self.client_unverified.email,
                "code": code,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_unverified.refresh_from_db()

        self.assertTrue(
            self.client_unverified.email_verified
        )

    def test_verify_email_with_invalid_code(self):
        response = self.client.post(
            "/api/verify-email/",
            {
                "email": self.client_unverified.email,
                "code": "000000",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.client_unverified.refresh_from_db()

        self.assertFalse(
            self.client_unverified.email_verified
        )

    # ==========================================================
    # VERIFICATION CODE SERVICE
    # ==========================================================

    def test_new_code_invalidates_previous_code(self):
        first_code, _ = create_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
        )

        second_code, _ = create_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
        )

        first_valid, _ = check_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
            first_code,
        )

        self.assertFalse(first_valid)

        second_valid, _ = check_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
            second_code,
        )

        self.assertTrue(second_valid)

    def test_consumed_code_cannot_be_reused(self):
        code, _ = create_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
        )

        first_valid, _ = check_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
            code,
        )

        self.assertTrue(first_valid)

        second_valid, _ = check_verification_code(
            self.client_unverified,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
            code,
        )

        self.assertFalse(second_valid)

    # ==========================================================
    # FORGOT PASSWORD
    # ==========================================================

    def test_forgot_password_sends_email(self):
        response = self.client.post(
            "/api/forgot-password/",
            {
                "email": self.client_verified.email,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

        self.assertIn(
            self.client_verified.email,
            mail.outbox[0].to,
        )

    def test_forgot_password_does_not_change_password_immediately(self):
        old_password = "TestPassword123!"

        response = self.client.post(
            "/api/forgot-password/",
            {
                "email": self.client_verified.email,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_verified.refresh_from_db()

        self.assertTrue(
            self.client_verified.check_password(
                old_password
            )
        )

    def test_forgot_password_unknown_email_returns_generic_response(self):
        response = self.client.post(
            "/api/forgot-password/",
            {
                "email": "unknown@test.local",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    # ==========================================================
    # RESET PASSWORD
    # ==========================================================

    def test_reset_password_with_invalid_code_is_refused(self):
        old_password = "TestPassword123!"

        response = self.client.post(
            "/api/reset-password/",
            {
                "email": self.client_verified.email,
                "code": "000000",
                "password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.client_verified.refresh_from_db()

        self.assertTrue(
            self.client_verified.check_password(
                old_password
            )
        )

    def test_reset_password_with_valid_code_changes_password(self):
        code, _ = create_verification_code(
            self.client_verified,
            VerificationCode.Purpose.PASSWORD_RESET,
        )

        response = self.client.post(
            "/api/reset-password/",
            {
                "email": self.client_verified.email,
                "code": code,
                "password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_verified.refresh_from_db()

        self.assertTrue(
            self.client_verified.check_password(
                "NewPassword123!"
            )
        )

        self.assertFalse(
            self.client_verified.check_password(
                "TestPassword123!"
            )
        )

    def test_reset_password_code_cannot_be_reused(self):
        code, _ = create_verification_code(
            self.client_verified,
            VerificationCode.Purpose.PASSWORD_RESET,
        )

        first_response = self.client.post(
            "/api/reset-password/",
            {
                "email": self.client_verified.email,
                "code": code,
                "password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            first_response.status_code,
            200,
        )

        second_response = self.client.post(
            "/api/reset-password/",
            {
                "email": self.client_verified.email,
                "code": code,
                "password": "AnotherPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            second_response.status_code,
            400,
        )

    # ==========================================================
    # RESEND CODE
    # ==========================================================

    def test_resend_email_verification_code(self):
        response = self.client.post(
            "/api/resend-code/",
            {
                "email": self.client_unverified.email,
                "purpose": (
                    VerificationCode.Purpose.EMAIL_VERIFICATION
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

    def test_resend_password_reset_code(self):
        response = self.client.post(
            "/api/resend-code/",
            {
                "email": self.client_verified.email,
                "purpose": (
                    VerificationCode.Purpose.PASSWORD_RESET
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

    def test_resend_rejects_invalid_purpose(self):
        response = self.client.post(
            "/api/resend-code/",
            {
                "email": self.client_verified.email,
                "purpose": "INVALID_PURPOSE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )
