from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient


User = get_user_model()


class UserRoleManagementTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="role_admin",
            email="role.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="role_client",
            email="role.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.employee = User.objects.create_user(
            username="role_employee",
            email="role.employee@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.superuser = User.objects.create_superuser(
            username="role_superuser",
            email="role.superuser@test.local",
            password="SuperPassword123!",
        )

        self.api_client.force_authenticate(
            user=self.admin
        )

    def test_admin_can_promote_client_to_employee(self):
        response = self.api_client.patch(
            (
                f"/api/users-rights/"
                f"{self.client_user.id}/"
                "promote-employee/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_user.refresh_from_db()

        self.assertEqual(
            self.client_user.role,
            User.Role.EMPLOYEE,
        )

        self.assertFalse(
            self.client_user.is_staff
        )

        self.assertEqual(
            response.data["role"],
            User.Role.EMPLOYEE,
        )

    def test_admin_can_remove_employee_role(self):
        response = self.api_client.patch(
            (
                f"/api/users-rights/"
                f"{self.employee.id}/"
                "remove-employee/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.employee.refresh_from_db()

        self.assertEqual(
            self.employee.role,
            User.Role.CLIENT,
        )

        self.assertFalse(
            self.employee.is_staff
        )

        self.assertEqual(
            response.data["role"],
            User.Role.CLIENT,
        )

    def test_admin_cannot_modify_own_employee_role(self):
        response = self.api_client.patch(
            (
                f"/api/users-rights/"
                f"{self.admin.id}/"
                "promote-employee/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.admin.refresh_from_db()

        self.assertEqual(
            self.admin.role,
            User.Role.ADMIN,
        )

    def test_superuser_role_cannot_be_modified_from_dashboard(self):
        response = self.api_client.patch(
            (
                f"/api/users-rights/"
                f"{self.superuser.id}/"
                "promote-employee/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.superuser.refresh_from_db()

        self.assertTrue(
            self.superuser.is_superuser
        )