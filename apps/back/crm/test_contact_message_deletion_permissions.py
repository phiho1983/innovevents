from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage


User = get_user_model()


class ContactMessageDeletionPermissionTests(
    APITestCase
):
    def setUp(self):
        self.admin = (
            User.objects.create_user(
                username="admin_delete_message",
                email="admin-message@example.com",
                password="TestPassword123!",
                role=User.Role.ADMIN,
                email_verified=True,
            )
        )

        self.employee = (
            User.objects.create_user(
                username="employee_delete_message",
                email="employee-message@example.com",
                password="TestPassword123!",
                role=User.Role.EMPLOYEE,
                email_verified=True,
            )
        )

    def create_message(
        self,
        *,
        status_value,
        email,
    ):
        return ContactMessage.objects.create(
            name="Jean Dupont",
            email=email,
            subject="Message de test",
            message="Contenu du message.",
            status=status_value,
        )

    def test_admin_can_delete_archived_message(
        self,
    ):
        message = self.create_message(
            status_value=(
                ContactMessage.Status.ARCHIVED
            ),
            email="archived-admin@example.com",
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            f"/api/contact-messages/{message.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            ContactMessage.objects.filter(
                id=message.id
            ).exists()
        )

    def test_employee_cannot_delete_archived_message(
        self,
    ):
        message = self.create_message(
            status_value=(
                ContactMessage.Status.ARCHIVED
            ),
            email="archived-employee@example.com",
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.delete(
            f"/api/contact-messages/{message.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            ContactMessage.objects.filter(
                id=message.id
            ).exists()
        )

    def test_admin_cannot_delete_active_message(
        self,
    ):
        message = self.create_message(
            status_value=(
                ContactMessage.Status.NEW
            ),
            email="active-admin@example.com",
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            f"/api/contact-messages/{message.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertTrue(
            ContactMessage.objects.filter(
                id=message.id
            ).exists()
        )
