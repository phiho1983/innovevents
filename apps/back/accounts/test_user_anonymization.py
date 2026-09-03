from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from bookings.models import Booking
from crm.models import Note
from events.models import Event
from reviews.models import Review


class UserAnonymizationTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_anonymization_test",
            email="admin-anonymization@example.com",
            password="TestPassword123!",
            role=User.Role.ADMIN,
            email_verified=True,
        )

        self.client.force_authenticate(
            user=self.admin
        )

    def user_url(self, user):
        return reverse(
            "users-rights-detail",
            kwargs={
                "pk": user.pk,
            },
        )

    def create_target_user(self):
        return User.objects.create_user(
            username="client_to_delete",
            email="client-delete@example.com",
            password="TestPassword123!",
            first_name="Jean",
            last_name="Dupont",
            role=User.Role.CLIENT,
            email_verified=True,
            is_active=True,
        )

    def test_admin_can_anonymize_user(self):
        target = self.create_target_user()
        target_id = target.id

        response = self.client.delete(
            self.user_url(target)
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        target.refresh_from_db()

        self.assertEqual(
            target.username,
            f"deleted_user_{target_id}",
        )

        self.assertEqual(
            target.email,
            "",
        )

        self.assertEqual(
            target.first_name,
            "",
        )

        self.assertEqual(
            target.last_name,
            "",
        )

        self.assertFalse(
            target.is_active
        )

        self.assertFalse(
            target.email_verified
        )

        self.assertFalse(
            target.is_staff
        )

        self.assertFalse(
            target.has_usable_password()
        )

    def test_admin_cannot_anonymize_own_account(self):
        response = self.client.delete(
            self.user_url(
                self.admin
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.admin.refresh_from_db()

        self.assertTrue(
            self.admin.is_active
        )

        self.assertEqual(
            self.admin.username,
            "admin_anonymization_test",
        )

    def test_admin_cannot_anonymize_superuser(self):
        superuser = User.objects.create_superuser(
            username="technical_superuser",
            email="super@example.com",
            password="TestPassword123!",
        )

        response = self.client.delete(
            self.user_url(
                superuser
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        superuser.refresh_from_db()

        self.assertTrue(
            superuser.is_active
        )

        self.assertTrue(
            superuser.is_superuser
        )

    def test_employee_cannot_anonymize_user(self):
        employee = User.objects.create_user(
            username="employee_test",
            email="employee@example.com",
            password="TestPassword123!",
            role=User.Role.EMPLOYEE,
            email_verified=True,
        )

        target = self.create_target_user()

        self.client.force_authenticate(
            user=employee
        )

        response = self.client.delete(
            self.user_url(target)
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        target.refresh_from_db()

        self.assertTrue(
            target.is_active
        )

    def test_business_history_is_preserved_after_anonymization(
        self,
    ):
        target = self.create_target_user()

        event = Event.objects.create(
            title="Événement historique",
            description="Événement à conserver",
            city="Paris",
            start_at=timezone.now(),
            capacity=50,
            organizer=target,
            client=target,
            status=Event.Status.ACCEPTED,
        )

        note = Note.objects.create(
            author=target,
            client=target,
            content="Note historique à conserver",
        )

        booking = Booking.objects.create(
            user=target,
            event=event,
            quantity=2,
            status=Booking.Status.CONFIRMED,
        )

        review = Review.objects.create(
            author=target,
            rating=5,
            content="Très bon événement",
        )

        response = self.client.delete(
            self.user_url(target)
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        target.refresh_from_db()

        self.assertFalse(
            target.is_active
        )

        self.assertTrue(
            Event.objects.filter(
                pk=event.pk
            ).exists()
        )

        self.assertTrue(
            Note.objects.filter(
                pk=note.pk
            ).exists()
        )

        self.assertTrue(
            Booking.objects.filter(
                pk=booking.pk
            ).exists()
        )

        self.assertTrue(
            Review.objects.filter(
                pk=review.pk
            ).exists()
        )

        event.refresh_from_db()
        note.refresh_from_db()
        booking.refresh_from_db()
        review.refresh_from_db()

        self.assertEqual(
            event.organizer_id,
            target.id,
        )

        self.assertEqual(
            event.client_id,
            target.id,
        )

        self.assertEqual(
            note.author_id,
            target.id,
        )

        self.assertEqual(
            note.client_id,
            target.id,
        )

        self.assertEqual(
            booking.user_id,
            target.id,
        )

        self.assertEqual(
            review.author_id,
            target.id,
        )