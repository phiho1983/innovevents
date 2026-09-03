from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class ContactMessageWorkflowTests(
    APITestCase
):
    def setUp(self):
        self.employee = (
            User.objects.create_user(
                username="employee_messages",
                email="employee@example.com",
                password="TestPassword123!",
                role=User.Role.EMPLOYEE,
                email_verified=True,
            )
        )

    def test_public_can_send_contact_message(
        self,
    ):
        response = self.client.post(
            "/api/contact-messages/",
            {
                "name":
                    "Jean Dupont",
                "email":
                    "jean@example.com",
                "subject":
                    "Question générale",
                "message":
                    "Bonjour, je souhaite avoir "
                    "un renseignement.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["name"],
            "Jean Dupont",
        )

        self.assertEqual(
            response.data["status"],
            "NEW",
        )

    def test_public_cannot_list_messages(
        self,
    ):
        response = self.client.get(
            "/api/contact-messages/"
        )

        self.assertIn(
            response.status_code,
            (
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ),
        )

    def test_employee_can_list_messages(
        self,
    ):
        self.client.post(
            "/api/contact-messages/",
            {
                "name":
                    "Marie Martin",
                "email":
                    "marie@example.com",
                "subject":
                    "Partenariat",
                "message":
                    "Je souhaite vous contacter.",
            },
            format="json",
        )

        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.get(
            "/api/contact-messages/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        data = (
            response.data.get(
                "results",
                response.data,
            )
            if isinstance(
                response.data,
                dict,
            )
            else response.data
        )

        self.assertEqual(
            len(data),
            1,
        )

    def test_contact_message_limits_are_enforced(
        self,
    ):
        response = self.client.post(
            "/api/contact-messages/",
            {
                "name":
                    "Jean Dupont",
                "email":
                    "jean@example.com",
                "subject":
                    "A" * 161,
                "message":
                    "B" * 5001,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


class ProjectRequestWorkflowTests(
    APITestCase
):
    def valid_request(self):
        return {
            "first_name":
                "Jean",
            "last_name":
                "Dupont",
            "email":
                "jean@example.com",
            "phone":
                "",
            "company":
                "",
            "city":
                "",
            "message":
                "Je souhaite organiser "
                "un anniversaire privé.",
        }

    def test_individual_can_send_project_request_without_company(
        self,
    ):
        response = self.client.post(
            "/api/prospects/",
            self.valid_request(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["company"],
            "",
        )

    def test_phone_and_city_can_be_unknown_at_first_contact(
        self,
    ):
        payload = (
            self.valid_request()
        )

        payload["phone"] = ""
        payload["city"] = ""

        response = self.client.post(
            "/api/prospects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_company_is_limited_to_120_characters(
        self,
    ):
        payload = (
            self.valid_request()
        )

        payload["company"] = (
            "A" * 121
        )

        response = self.client.post(
            "/api/prospects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "company",
            response.data,
        )

    def test_project_message_has_a_size_limit(
        self,
    ):
        payload = (
            self.valid_request()
        )

        payload["message"] = (
            "A" * 5001
        )

        response = self.client.post(
            "/api/prospects/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "message",
            response.data,
        )