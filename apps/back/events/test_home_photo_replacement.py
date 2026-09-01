import os
import tempfile

from io import BytesIO
from urllib.parse import urlparse
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from PIL import Image

from rest_framework import status
from rest_framework.test import APITestCase

from events.models import HomePhoto
from events.views import HomePhotoViewSet


User = get_user_model()


class HomePhotoReplacementTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="replacement_admin",
            email="replacement_admin@test.local",
            password="TestPassword123!",
            role=User.Role.ADMIN,
        )

        self.photo = HomePhoto.objects.create(
            slot=1,
            image_url="",
            cloudinary_public_id="",
            alt_text="Ancienne photo",
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
            (120, 120),
            color="white",
        )

        image.save(
            buffer,
            format="JPEG",
        )

        buffer.seek(0)

        return SimpleUploadedFile(
            "replacement.jpg",
            buffer.read(),
            content_type="image/jpeg",
        )

    def create_old_local_image(self):
        old_name = default_storage.save(
            "home/carousel/old-photo.jpg",
            ContentFile(
                b"ancienne image locale"
            ),
        )

        old_url = (
            "http://localhost"
            f"{default_storage.url(old_name)}"
        )

        self.photo.image_url = old_url
        self.photo.cloudinary_public_id = ""
        self.photo.alt_text = "Ancienne photo"

        self.photo.save(
            update_fields=[
                "image_url",
                "cloudinary_public_id",
                "alt_text",
            ]
        )

        return old_name, old_url

    def storage_name_from_url(
        self,
        image_url,
    ):
        path = urlparse(
            image_url
        ).path

        media_url = settings.MEDIA_URL

        if not path.startswith(
            media_url
        ):
            return None

        return path[
            len(media_url):
        ].lstrip("/")

    def test_local_replacement_deletes_previous_file(
        self,
    ):
        old_name, old_url = (
            self.create_old_local_image()
        )

        self.assertTrue(
            default_storage.exists(
                old_name
            )
        )

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
                        "Nouvelle photo locale",
                },
                format="multipart",
                HTTP_HOST="localhost",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.photo.refresh_from_db()

        self.assertNotEqual(
            self.photo.image_url,
            old_url,
        )

        self.assertFalse(
            default_storage.exists(
                old_name
            )
        )

        new_name = (
            self.storage_name_from_url(
                self.photo.image_url
            )
        )

        self.assertIsNotNone(
            new_name
        )

        self.assertTrue(
            default_storage.exists(
                new_name
            )
        )

    @patch.object(
        HomePhotoViewSet,
        "delete_from_cloudinary",
        create=True,
    )
    @patch.object(
        HomePhotoViewSet,
        "upload_to_cloudinary",
    )
    def test_cloudinary_replacement_deletes_previous_asset(
        self,
        mocked_upload,
        mocked_delete,
    ):
        self.photo.image_url = (
            "https://res.cloudinary.com/"
            "vzfbhtgi/image/upload/"
            "innovevents/home/carousel/old-photo.jpg"
        )

        self.photo.cloudinary_public_id = (
            "innovevents/home/carousel/old-photo"
        )

        self.photo.save(
            update_fields=[
                "image_url",
                "cloudinary_public_id",
            ]
        )

        mocked_upload.return_value = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "vzfbhtgi/image/upload/"
                "innovevents/home/carousel/"
                "new-photo.jpg"
            ),
            "public_id": (
                "innovevents/home/carousel/"
                "new-photo"
            ),
        }

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL": (
                    "cloudinary://"
                    "fake_key:"
                    "fake_secret@vzfbhtgi"
                ),
            },
        ):
            response = self.client.post(
                self.upload_url,
                {
                    "image":
                        self.make_image_file(),
                    "alt_text":
                        "Nouvelle photo Cloudinary",
                },
                format="multipart",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        mocked_upload.assert_called_once()

        mocked_delete.assert_called_once_with(
            "innovevents/home/carousel/old-photo"
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.cloudinary_public_id,
            (
                "innovevents/home/carousel/"
                "new-photo"
            ),
        )

    @patch.object(
        HomePhotoViewSet,
        "upload_to_local_storage",
    )
    def test_failed_local_upload_keeps_previous_file(
        self,
        mocked_upload,
    ):
        old_name, old_url = (
            self.create_old_local_image()
        )

        mocked_upload.side_effect = OSError(
            "Simulation panne stockage"
        )

        self.client.raise_request_exception = (
            False
        )

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
                        "Ne doit pas être enregistré",
                },
                format="multipart",
                HTTP_HOST="localhost",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

        self.assertTrue(
            default_storage.exists(
                old_name
            )
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.image_url,
            old_url,
        )

        self.assertEqual(
            self.photo.alt_text,
            "Ancienne photo",
        )

    @patch(
        "events.serializers."
        "HomePhotoSerializer.save"
    )
    def test_database_failure_removes_new_local_file(
        self,
        mocked_save,
    ):
        old_name, old_url = (
            self.create_old_local_image()
        )

        mocked_save.side_effect = RuntimeError(
            "Simulation panne BDD"
        )

        self.client.raise_request_exception = (
            False
        )

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
                        "Nouvelle photo",
                },
                format="multipart",
                HTTP_HOST="localhost",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

        self.assertTrue(
            default_storage.exists(
                old_name
            )
        )

        self.photo.refresh_from_db()

        self.assertEqual(
            self.photo.image_url,
            old_url,
        )

        stored_files = []

        for root, dirs, files in os.walk(
            self.temp_media.name
        ):
            for filename in files:
                stored_files.append(
                    os.path.join(
                        root,
                        filename,
                    )
                )

        self.assertEqual(
            len(stored_files),
            1,
        )