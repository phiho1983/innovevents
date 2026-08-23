import re

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase

from rest_framework.test import APIClient

from accounts.models import VerificationCode

from .models import (
    ClientProfile,
    Prospect,
    Quote,
    QuoteItem,
)


User = get_user_model()


def extract_six_digit_code(message_body):
    match = re.search(
        r"\b(\d{6})\b",
        message_body,
    )

    if match is None:
        raise AssertionError(
            "Aucun code à 6 chiffres "
            "trouvé dans l'e-mail."
        )

    return match.group(1)


def extract_activation_parameters(
    message_body
):
    match = re.search(
        (
            r"/activation"
            r"\?uid=(\d+)"
            r"&token=([A-Za-z0-9_-]+)"
        ),
        message_body,
    )

    if match is None:
        raise AssertionError(
            "Aucun lien d'activation "
            "valide trouvé dans l'e-mail."
        )

    return (
        int(match.group(1)),
        match.group(2),
    )


class ProspectModelTest(TestCase):
    def test_str(self):
        prospect = Prospect(
            first_name="Jean",
            last_name="Dupont",
            email="j@test.com",
        )

        self.assertEqual(
            str(prospect),
            "Jean Dupont (j@test.com)",
        )


class ProspectAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_prospect_public(self):
        data = {
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "jean@test.com",
            "phone": "0612345678",
            "company": "ACME",
            "city": "Paris",
            "message": "Test",
        }

        response = self.client.post(
            "/api/prospects/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            Prospect.objects.count(),
            1,
        )

        self.assertEqual(
            Prospect.objects.first().status,
            Prospect.Status.TO_CONTACT,
        )

    def test_create_prospect_missing_email(self):
        data = {
            "first_name": "Jean",
            "last_name": "Dupont",
            "phone": "0612345678",
            "company": "ACME",
            "city": "Paris",
            "message": "Test",
        }

        response = self.client.post(
            "/api/prospects/",
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "email",
            response.data,
        )

    def test_list_prospects_requires_admin(self):
        response = self.client.get(
            "/api/prospects/"
        )

        self.assertIn(
            response.status_code,
            [
                401,
                403,
            ],
        )


class ProspectConversionTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="business_admin",
            email="admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            email_verified=True,
        )

        self.normal_client = User.objects.create_user(
            username="normal_client",
            email="normal@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            email_verified=True,
        )

        self.prospect = Prospect.objects.create(
            first_name="Alice",
            last_name="Martin",
            email="alice.martin@test.local",
            phone="0611223344",
            company="ACME Events",
            city="Paris",
            message=(
                "Organisation d'un événement."
            ),
        )

    def convert_prospect(self):
        self.client.force_authenticate(
            user=self.admin
        )

        return self.client.post(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/convert/"
            ),
            {},
            format="json",
        )

    def test_business_admin_can_convert_prospect_to_secure_client(self):
        response = (
            self.convert_prospect()
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        user = User.objects.get(
            email=(
                "alice.martin@test.local"
            )
        )

        self.assertEqual(
            user.role,
            User.Role.CLIENT,
        )

        self.assertFalse(
            user.is_staff
        )

        self.assertFalse(
            user.is_superuser
        )

        self.assertFalse(
            user.email_verified
        )

        self.assertFalse(
            user.has_usable_password()
        )

        self.assertEqual(
            user.first_name,
            "Alice",
        )

        self.assertEqual(
            user.last_name,
            "Martin",
        )

        profile = (
            ClientProfile.objects.get(
                user=user
            )
        )

        self.assertEqual(
            profile.company,
            "ACME Events",
        )

        self.assertEqual(
            profile.phone,
            "0611223344",
        )

        self.prospect.refresh_from_db()

        self.assertEqual(
            self.prospect.status,
            Prospect.Status.QUALIFIED,
        )

        self.assertTrue(
            VerificationCode.objects.filter(
                user=user,
                purpose=(
                    VerificationCode
                    .Purpose
                    .ACCOUNT_ACTIVATION
                ),
                used_at__isnull=True,
            ).exists()
        )

        self.assertFalse(
            VerificationCode.objects.filter(
                user=user,
                purpose=(
                    VerificationCode
                    .Purpose
                    .EMAIL_VERIFICATION
                ),
                used_at__isnull=True,
            ).exists()
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

        self.assertIn(
            user.email,
            mail.outbox[0].to,
        )

        self.assertIn(
            user.username,
            mail.outbox[0].body,
        )

        self.assertIn(
            "/activation?uid=",
            mail.outbox[0].body,
        )

        self.assertNotIn(
            "Mot de passe:",
            mail.outbox[0].body,
        )

        self.assertTrue(
            response.data[
                "activation_required"
            ]
        )

        self.assertTrue(
            response.data[
                "password_setup_required"
            ]
        )

        self.assertTrue(
            response.data[
                "activation_email_sent"
            ]
        )

        self.assertNotIn(
            "email_verification_required",
            response.data,
        )

    def test_client_cannot_convert_prospect(self):
        self.client.force_authenticate(
            user=self.normal_client
        )

        response = self.client.post(
            (
                f"/api/prospects/"
                f"{self.prospect.id}/convert/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertFalse(
            User.objects.filter(
                email=self.prospect.email
            ).exists()
        )

    def test_conversion_is_refused_if_email_already_has_account(self):
        User.objects.create_user(
            username="existing_alice",
            email=self.prospect.email,
            password=(
                "ExistingPassword123!"
            ),
            role=User.Role.CLIENT,
            email_verified=True,
        )

        response = (
            self.convert_prospect()
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            User.objects.filter(
                email__iexact=(
                    self.prospect.email
                )
            ).count(),
            1,
        )

        self.prospect.refresh_from_db()

        self.assertNotEqual(
            self.prospect.status,
            Prospect.Status.QUALIFIED,
        )

    def test_converted_client_can_complete_full_authentication_flow(self):
        conversion_response = (
            self.convert_prospect()
        )

        self.assertEqual(
            conversion_response.status_code,
            201,
        )

        user = User.objects.get(
            email=(
                "alice.martin@test.local"
            )
        )

        self.assertFalse(
            user.has_usable_password()
        )

        self.assertFalse(
            user.email_verified
        )

        uid, activation_token = (
            extract_activation_parameters(
                mail.outbox[-1].body
            )
        )

        self.assertEqual(
            uid,
            user.id,
        )

        activation_response = (
            self.client.post(
                "/api/activate-account/",
                {
                    "uid": uid,
                    "token":
                        activation_token,
                    "password": (
                        "AliceSecurePassword123!"
                    ),
                },
                format="json",
            )
        )

        self.assertEqual(
            activation_response.status_code,
            200,
        )

        user.refresh_from_db()

        self.assertTrue(
            user.email_verified
        )

        self.assertTrue(
            user.has_usable_password()
        )

        self.assertTrue(
            user.check_password(
                "AliceSecurePassword123!"
            )
        )

        self.assertFalse(
            VerificationCode.objects.filter(
                user=user,
                purpose=(
                    VerificationCode
                    .Purpose
                    .ACCOUNT_ACTIVATION
                ),
                used_at__isnull=True,
            ).exists()
        )

        login_response = (
            self.client.post(
                "/api/login/",
                {
                    "username":
                        user.username,
                    "password": (
                        "AliceSecurePassword123!"
                    ),
                },
                format="json",
            )
        )

        self.assertEqual(
            login_response.status_code,
            200,
        )

        self.assertTrue(
            login_response.data[
                "requires_2fa"
            ]
        )

        self.assertNotIn(
            "access",
            login_response.data,
        )

        self.assertNotIn(
            "refresh",
            login_response.data,
        )

        login_2fa_code = (
            extract_six_digit_code(
                mail.outbox[-1].body
            )
        )

        login_2fa_response = (
            self.client.post(
                "/api/login-2fa/",
                {
                    "username":
                        user.username,
                    "code":
                        login_2fa_code,
                },
                format="json",
            )
        )

        self.assertEqual(
            login_2fa_response.status_code,
            200,
        )

        self.assertIn(
            "access",
            login_2fa_response.data,
        )

        self.assertIn(
            "refresh",
            login_2fa_response.data,
        )


class QuoteModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="a@test.com",
            password="pass1234",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.prospect = Prospect.objects.create(
            first_name="X",
            last_name="Y",
            email="x@y.com",
            phone="0600000000",
            company="Z",
            city="Paris",
            message="Ok",
        )

    def test_quote_totals(self):
        quote = Quote.objects.create(
            prospect=self.prospect,
            tva_rate=Decimal("0.20"),
        )

        QuoteItem.objects.create(
            quote=quote,
            label="Traiteur",
            amount_ht=Decimal("2000.00"),
        )

        QuoteItem.objects.create(
            quote=quote,
            label="Salle",
            amount_ht=Decimal("1000.00"),
        )

        self.assertEqual(
            float(quote.total_ht),
            3000.0,
        )

        self.assertEqual(
            float(quote.total_tva),
            600.0,
        )

        self.assertEqual(
            float(quote.total_ttc),
            3600.0,
        )

    def test_create_quote_as_admin(self):
        client = APIClient()

        client.force_authenticate(
            user=self.admin
        )

        response = client.post(
            "/api/quotes/",
            {
                "prospect":
                    self.prospect.id,
                "tva_rate":
                    "0.20",
                "items": [
                    {
                        "label": "DJ",
                        "amount_ht": "500",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            QuoteItem.objects.count(),
            1,
        )