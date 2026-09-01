from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class HomeHeroAdminTests(APITestCase):

    def setUp(self):
        self.client_user = User.objects.create_user(
            username="hero_client",
            email="hero-client@example.com",
            password="TestPassword123!",
        )
        self.client_user.role = User.Role.CLIENT
        self.client_user.save(
            update_fields=["role"]
        )

        self.employee_user = User.objects.create_user(
            username="hero_employee",
            email="hero-employee@example.com",
            password="TestPassword123!",
        )
        self.employee_user.role = User.Role.EMPLOYEE
        self.employee_user.save(
            update_fields=["role"]
        )

        self.admin_user = User.objects.create_user(
            username="hero_admin",
            email="hero-admin@example.com",
            password="TestPassword123!",
        )
        self.admin_user.role = User.Role.ADMIN
        self.admin_user.save(
            update_fields=["role"]
        )


    def test_public_can_read_home_hero(self):
        response = self.client.get(
            "/api/home-hero/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "image_url",
            response.data,
        )

        self.assertIn(
            "alt_text",
            response.data,
        )


    def test_client_cannot_upload_home_hero(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.post(
            "/api/home-hero/upload/",
            {},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )


    def test_employee_cannot_upload_home_hero(self):
        self.client.force_authenticate(
            user=self.employee_user
        )

        response = self.client.post(
            "/api/home-hero/upload/",
            {},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )


    def test_admin_can_reach_home_hero_upload_validation(self):
        self.client.force_authenticate(
            user=self.admin_user
        )

        response = self.client.post(
            "/api/home-hero/upload/",
            {},
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "image",
            response.data,
        )