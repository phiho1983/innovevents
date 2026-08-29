from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import Prospect


User = get_user_model()


class ProspectConvertedClientSecurityTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.employee = User.objects.create_user(
            username="employee_security",
            email="employee.security@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_one = User.objects.create_user(
            username="client_one",
            email="client.one@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_two = User.objects.create_user(
            username="client_two",
            email="client.two@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.api_client.force_authenticate(
            user=self.employee
        )

    def create_prospect(
        self,
        *,
        converted_client=None,
    ):
        return Prospect.objects.create(
            first_name="Claire",
            last_name="Martin",
            email="claire.martin@test.local",
            phone="0611223344",
            company="Martin Events",
            city="Lyon",
            message="Organisation événement professionnel.",
            converted_client=converted_client,
        )

    def test_employee_cannot_assign_converted_client_with_generic_patch(
        self,
    ):
        prospect = self.create_prospect()

        response = self.api_client.patch(
            f"/api/prospects/{prospect.id}/",
            {
                "converted_client":
                    self.client_one.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        prospect.refresh_from_db()

        self.assertIsNone(
            prospect.converted_client_id
        )

    def test_employee_cannot_replace_existing_converted_client_with_generic_patch(
        self,
    ):
        prospect = self.create_prospect(
            converted_client=self.client_one
        )

        response = self.api_client.patch(
            f"/api/prospects/{prospect.id}/",
            {
                "converted_client":
                    self.client_two.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        prospect.refresh_from_db()

        self.assertEqual(
            prospect.converted_client_id,
            self.client_one.id,
        )