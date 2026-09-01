import os

from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import (
    SimpleUploadedFile,
)

from PIL import Image

from rest_framework import status
from rest_framework.test import APITestCase

from events.models import HomePhoto
from events.views import HomePhotoViewSet


User = get_user_model()


class HomePhotoUploadTest(APITestCase):
    def setUp(self):
        self.password = "TestPassword123!"

        self.admin = User.objects.create_user(
            username="photo_admin",
            email="photo_admin@test.local",
            password=self.password,
            role=User.Role.ADMIN,
        )

        self.employee = User.objects.create_user(
            username="photo_employee",
            email="photo_employee@test.local",
            password=self.password,
            role=User.Role.EMPLOYEE,
        )

        self.client_user = User.objects.create_user(
            username="photo_client",
            email="photo_client@test.local",
            password=self.password,
            role=User.Role.CLIENT,
        )

        self.photo = HomePhoto.objects.create(
            slot=1,
            image_url="",
            cloudinary_public_id="",
            alt_text="Photo accueil initiale",
        )

        self.upload_url = (
            f"/api/home-photos/"
            f"{self.photo.pk}/upload/"
        )

    def make_image_file(self):
        buffer = BytesIO()

        image = Image.new(
            "RGB",
            (100, 100),
            color="white",
        )

        image.save(
            buffer,
            format="JPEG",
        )

        buffer.seek(0)

        return SimpleUploadedFile(
            "home-photo.jpg",
            buffer.read(),
            content_type="image/jpeg",
        )

    def test_employee_cannot_upload_home_photo(self):
        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.post(
            self.upload_url,
            {
                "image":
                    self.make_image_file(),
                "alt_text":
                    "Tentative employé",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_client_cannot_upload_home_photo(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.post(
            self.upload_url,
            {
                "image":
                    self.make_image_file(),
                "alt_text":
                    "Tentative client",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    @patch.object(
        HomePhotoViewSet,
        "upload_to_cloudinary",
    )
    def test_admin_can_upload_home_photo(
        self,
        mocked_upload,
    ):
        mocked_upload.return_value = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "innovevents/image/upload/"
                "home/photo-1.jpg"
            ),
            "public_id":
                "innovevents/home/photo-1",
        }

        self.client.force_authenticate(
            user=self.admin
        )

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL": (
                    "cloudinary://"
                    "fake_key:fake_secret@vzfbhtgi"
                ),
            },
        ):
            response = self.client.post(
                self.upload_url,
                {
                    "image":
                        self.make_image_file(),
                    "alt_text":
                        "Séminaire professionnel",
                },
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.image_url,
            (
                "https://res.cloudinary.com/"
                "innovevents/image/upload/"
                "home/photo-1.jpg"
            ),
        )

        self.assertEqual(
            self.photo.cloudinary_public_id,
            "innovevents/home/photo-1",
        )

        self.assertEqual(
            self.photo.alt_text,
            "Séminaire professionnel",
        )

        mocked_upload.assert_called_once()

    def test_admin_cannot_upload_non_image_file(self):
        self.client.force_authenticate(
            user=self.admin
        )

        invalid_file = SimpleUploadedFile(
            "not-an-image.txt",
            b"ceci n'est pas une image",
            content_type="text/plain",
        )

        response = self.client.post(
            self.upload_url,
            {
                "image":
                    invalid_file,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )