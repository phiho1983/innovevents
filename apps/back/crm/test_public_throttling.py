from django.core.cache import cache

from rest_framework import status
from rest_framework.test import APITestCase


class PublicCRMThrottleTests(
    APITestCase
):
    def setUp(self):
        cache.clear()

    def test_contact_message_public_rate_limit(
        self,
    ):
        ip_address = "203.0.113.10"

        for index in range(10):
            response = self.client.post(
                "/api/contact-messages/",
                {
                    "name":
                        "Jean Dupont",
                    "email":
                        f"contact{index}@example.com",
                    "subject":
                        "Question",
                    "message":
                        "Bonjour, je souhaite obtenir "
                        "un renseignement.",
                },
                format="json",
                REMOTE_ADDR=ip_address,
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
            )

        response = self.client.post(
            "/api/contact-messages/",
            {
                "name":
                    "Jean Dupont",
                "email":
                    "blocked-contact@example.com",
                "subject":
                    "Question",
                "message":
                    "Cette requête doit être limitée.",
            },
            format="json",
            REMOTE_ADDR=ip_address,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

    def test_prospect_public_rate_limit(
        self,
    ):
        ip_address = "203.0.113.20"

        for index in range(10):
            response = self.client.post(
                "/api/prospects/",
                {
                    "first_name":
                        "Jean",
                    "last_name":
                        "Dupont",
                    "email":
                        f"prospect{index}@example.com",
                    "phone":
                        "",
                    "company":
                        "",
                    "city":
                        "Paris",
                    "message":
                        "Je souhaite organiser "
                        "un événement.",
                },
                format="json",
                REMOTE_ADDR=ip_address,
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
            )

        response = self.client.post(
            "/api/prospects/",
            {
                "first_name":
                    "Jean",
                "last_name":
                    "Dupont",
                "email":
                    "blocked-prospect@example.com",
                "phone":
                    "",
                "company":
                    "",
                "city":
                    "Paris",
                "message":
                    "Cette demande doit être limitée.",
            },
            format="json",
            REMOTE_ADDR=ip_address,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )