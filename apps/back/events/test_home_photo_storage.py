import os
import tempfile

from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from PIL import Image

from rest_framework import status
from rest_framework.test import APITestCase

from events.models import HomePhoto
from events.views import HomePhotoViewSet


User = get_user_model()


class HomePhotoStorageTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="storage_admin",
            email="storage_admin@test.local",
            password="TestPassword123!",
            role=User.Role.ADMIN,
        )

        self.photo = HomePhoto.objects.create(
            slot=1,
            image_url="",
            cloudinary_public_id="",
            alt_text="Photo accueil",
        )

        self.upload_url = (
            f"/api/home-photos/"
            f"{self.photo.pk}/upload/"
        )

        self.client.force_authenticate(
            user=self.admin
        )

        self.temp_media = (
            tempfile.TemporaryDirectory()
        )

        self.override_media = override_settings(
            MEDIA_ROOT=self.temp_media.name,
            MEDIA_URL="/media/",
        )

        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        self.temp_media.cleanup()

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

    @patch.object(
        HomePhotoViewSet,
        "upload_to_cloudinary",
    )
    def test_local_environment_uses_local_storage(
        self,
        mocked_cloudinary_upload,
    ):
        mocked_cloudinary_upload.return_value = {
            "secure_url": (
                "https://cloudinary.example/"
                "should-not-be-used.jpg"
            ),
            "public_id":
                "should-not-be-used",
        }

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL": "",
            },
        ):
            response = self.client.post(
                self.upload_url,
                {
                    "image":
                        self.make_image_file(),
                    "alt_text":
                        "Photo locale",
                },
                format="multipart",
                HTTP_HOST="localhost",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        mocked_cloudinary_upload.assert_not_called()

        self.photo.refresh_from_db()

        self.assertTrue(
            self.photo.image_url.startswith(
                "http://localhost/media/"
            )
        )

        self.assertEqual(
            self.photo.cloudinary_public_id,
            "",
        )

        self.assertEqual(
            self.photo.alt_text,
            "Photo locale",
        )

    @patch.object(
        HomePhotoViewSet,
        "upload_to_cloudinary",
    )
    def test_production_environment_uses_cloudinary(
        self,
        mocked_cloudinary_upload,
    ):
        mocked_cloudinary_upload.return_value = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "vzfbhtgi/image/upload/"
                "innovevents/home/carousel/photo.jpg"
            ),
            "public_id": (
                "innovevents/home/carousel/photo"
            ),
        }

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
                        "Photo production",
                },
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        mocked_cloudinary_upload.assert_called_once()

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.image_url,
            (
                "https://res.cloudinary.com/"
                "vzfbhtgi/image/upload/"
                "innovevents/home/carousel/photo.jpg"
            ),
        )

        self.assertEqual(
            self.photo.cloudinary_public_id,
            (
                "innovevents/home/carousel/photo"
            ),
        )

        self.assertEqual(
            self.photo.alt_text,
            "Photo production",
        )