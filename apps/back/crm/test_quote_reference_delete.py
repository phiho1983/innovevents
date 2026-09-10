from datetime import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from .models import Quote


User = get_user_model()


class QuoteReferenceAndDeleteTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="quote_admin",
            email="quote_admin@test.com",
            password="pass1234",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.employee = User.objects.create_user(
            username="quote_employee",
            email="quote_employee@test.com",
            password="pass1234",
            role=User.Role.EMPLOYEE,
            is_staff=False,
        )

    def test_quote_reference_uses_id_and_created_at(self):
        quote = Quote.objects.create()

        created_at = timezone.make_aware(
            datetime(
                2026,
                9,
                3,
                12,
                0,
                0,
            )
        )

        Quote.objects.filter(
            pk=quote.pk
        ).update(
            created_at=created_at
        )

        quote.refresh_from_db()

        self.assertEqual(
            quote.reference,
            f"{quote.id}-030926",
        )

    def test_admin_can_delete_draft_quote(self):
        quote = Quote.objects.create(
            status=Quote.Status.DRAFT,
        )

        client = APIClient()
        client.force_authenticate(
            user=self.admin
        )

        response = client.delete(
            f"/api/quotes/{quote.id}/"
        )

        self.assertEqual(
            response.status_code,
            204,
        )

        self.assertFalse(
            Quote.objects.filter(
                pk=quote.pk
            ).exists()
        )

    def test_admin_cannot_delete_sent_quote(self):
        quote = Quote.objects.create(
            status=Quote.Status.SENT,
        )

        client = APIClient()
        client.force_authenticate(
            user=self.admin
        )

        response = client.delete(
            f"/api/quotes/{quote.id}/"
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertTrue(
            Quote.objects.filter(
                pk=quote.pk
            ).exists()
        )

    def test_employee_cannot_delete_draft_quote(self):
        quote = Quote.objects.create(
            status=Quote.Status.DRAFT,
        )

        client = APIClient()
        client.force_authenticate(
            user=self.employee
        )

        response = client.delete(
            f"/api/quotes/{quote.id}/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Quote.objects.filter(
                pk=quote.pk
            ).exists()
        )