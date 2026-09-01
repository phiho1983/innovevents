from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from events.models import HomePhoto


User = get_user_model()


class HomePhotoAdminAccessTest(APITestCase):
    def setUp(self):
        self.password = "TestPassword123!"

        self.admin = User.objects.create_user(
            username="home_admin",
            email="home_admin@test.local",
            password=self.password,
            role=User.Role.ADMIN,
        )

        self.employee = User.objects.create_user(
            username="home_employee",
            email="home_employee@test.local",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.client_user = User.objects.create_user(
            username="home_client",
            email="home_client@test.local",
            password=self.password,
            role=User.Role.CLIENT,
        )

        self.photo = HomePhoto.objects.create(
            slot=1,
            image_url="",
            cloudinary_public_id="",
            alt_text="Photo accueil initiale",
        )

        self.list_url = reverse(
            "home-photo-list"
        )

        self.detail_url = reverse(
            "home-photo-detail",
            args=[self.photo.pk],
        )

    def test_home_photos_remain_publicly_readable(self):
        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_client_cannot_modify_home_photo(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.patch(
            self.detail_url,
            {
                "alt_text":
                    "Modification interdite client"
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_employee_cannot_modify_home_photo(self):
        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.patch(
            self.detail_url,
            {
                "alt_text":
                    "Modification interdite employé"
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_modify_home_photo_metadata(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.patch(
            self.detail_url,
            {
                "alt_text":
                    "Nouvelle photo accueil"
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.alt_text,
            "Nouvelle photo accueil",
        )