from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from .models import Prospect


User = get_user_model()


class RequestDeletionPermissionTests(
    APITestCase
):
    def setUp(self):
        self.admin = (
            User.objects.create_user(
                username="admin_delete_request",
                email="admin-delete@example.com",
                password="TestPassword123!",
                role=User.Role.ADMIN,
                email_verified=True,
            )
        )

        self.employee = (
            User.objects.create_user(
                username="employee_delete_request",
                email="employee-delete@example.com",
                password="TestPassword123!",
                role=User.Role.EMPLOYEE,
                email_verified=True,
            )
        )

    def create_request(
        self,
        *,
        status_value,
        email,
    ):
        return Prospect.objects.create(
            first_name="Jean",
            last_name="Dupont",
            email=email,
            phone="",
            company="",
            city="",
            message="Demande de test.",
            status=status_value,
        )

    def test_admin_can_delete_archived_request(
        self,
    ):
        request_item = (
            self.create_request(
                status_value=(
                    Prospect.Status.ARCHIVED
                ),
                email=(
                    "archived-admin@example.com"
                ),
            )
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            f"/api/prospects/{request_item.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Prospect.objects.filter(
                id=request_item.id
            ).exists()
        )

    def test_employee_cannot_delete_archived_request(
        self,
    ):
        request_item = (
            self.create_request(
                status_value=(
                    Prospect.Status.ARCHIVED
                ),
                email=(
                    "archived-employee@example.com"
                ),
            )
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.delete(
            f"/api/prospects/{request_item.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Prospect.objects.filter(
                id=request_item.id
            ).exists()
        )

    def test_admin_cannot_delete_active_request(
        self,
    ):
        request_item = (
            self.create_request(
                status_value=(
                    Prospect.Status.TO_CONTACT
                ),
                email=(
                    "active-admin@example.com"
                ),
            )
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.delete(
            f"/api/prospects/{request_item.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertTrue(
            Prospect.objects.filter(
                id=request_item.id
            ).exists()
        )
