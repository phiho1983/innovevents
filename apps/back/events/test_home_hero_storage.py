import io
import os
import tempfile

from pathlib import Path
from unittest.mock import patch

from PIL import Image

from django.core.files.uploadedfile import (
    SimpleUploadedFile,
)
from django.test import override_settings

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .home_hero_serializers import (
    HomeHeroSerializer,
)
from .models import HomeHero


class HomeHeroStorageTests(APITestCase):

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="hero_storage_admin",
            email="hero-storage-admin@example.com",
            password="TestPassword123!",
        )

        self.admin_user.role = User.Role.ADMIN
        self.admin_user.save(
            update_fields=["role"]
        )

        self.client.force_authenticate(
            user=self.admin_user
        )

        # Django utilise normalement "testserver"
        # comme hostname pendant les tests.
        #
        # Or HomeHero.image_url est un URLField
        # et "http://testserver/..." est rejeté
        # par sa validation.
        #
        # On simule donc ici un hostname réaliste
        # correspondant à l'environnement local.
        self.client.defaults[
            "HTTP_HOST"
        ] = "localhost:8000"

        self.media_directory = (
            tempfile.TemporaryDirectory()
        )

        self.override_media = override_settings(
            MEDIA_ROOT=self.media_directory.name,
            MEDIA_URL="/media/",
            ALLOWED_HOSTS=[
                "localhost",
                "testserver",
            ],
        )

        self.override_media.enable()


    def tearDown(self):
        self.override_media.disable()
        self.media_directory.cleanup()


    def make_image(
        self,
        filename="hero.png",
        image_format="PNG",
    ):
        buffer = io.BytesIO()

        Image.new(
            "RGB",
            (32, 32),
            (255, 0, 0),
        ).save(
            buffer,
            format=image_format,
        )

        content_types = {
            "PNG": "image/png",
            "JPEG": "image/jpeg",
            "WEBP": "image/webp",
        }

        return SimpleUploadedFile(
            filename,
            buffer.getvalue(),
            content_type=content_types[
                image_format
            ],
        )


    def get_local_hero_files(self):
        hero_directory = (
            Path(self.media_directory.name)
            / "home"
            / "hero"
        )

        if not hero_directory.exists():
            return []

        return sorted(
            path
            for path in hero_directory.iterdir()
            if path.is_file()
        )


    def upload_local(
        self,
        image,
        alt_text=None,
    ):
        data = {
            "image": image,
        }

        if alt_text is not None:
            data["alt_text"] = alt_text

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL": "",
            },
            clear=False,
        ):
            return self.client.post(
                "/api/home-hero/upload/",
                data,
                format="multipart",
            )


    def test_admin_uploads_valid_hero_to_local_storage(
        self,
    ):
        response = self.upload_local(
            self.make_image(),
            alt_text="Hero accueil",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            HomeHero.objects.count(),
            1,
        )

        hero = HomeHero.objects.get(
            pk=1
        )

        self.assertIn(
            (
                "http://localhost:8000/"
                "media/home/hero/"
            ),
            hero.image_url,
        )

        self.assertEqual(
            hero.cloudinary_public_id,
            "",
        )

        self.assertEqual(
            hero.alt_text,
            "Hero accueil",
        )

        files = self.get_local_hero_files()

        self.assertEqual(
            len(files),
            1,
        )

        self.assertTrue(
            files[0].exists()
        )


    def test_local_replacement_deletes_previous_file_after_success(
        self,
    ):
        first_response = self.upload_local(
            self.make_image(
                filename="first.png",
            ),
            alt_text="Premier Hero",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        first_files = (
            self.get_local_hero_files()
        )

        self.assertEqual(
            len(first_files),
            1,
        )

        old_file = first_files[0]

        second_response = self.upload_local(
            self.make_image(
                filename="second.png",
            ),
            alt_text="Nouveau Hero",
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            old_file.exists()
        )

        new_files = (
            self.get_local_hero_files()
        )

        self.assertEqual(
            len(new_files),
            1,
        )

        self.assertTrue(
            new_files[0].exists()
        )

        hero = HomeHero.objects.get(
            pk=1
        )

        self.assertEqual(
            hero.alt_text,
            "Nouveau Hero",
        )


    def test_local_database_failure_removes_new_file_and_keeps_old_file(
        self,
    ):
        first_response = self.upload_local(
            self.make_image(
                filename="old.png",
            ),
            alt_text="Ancien Hero",
        )

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        hero = HomeHero.objects.get(
            pk=1
        )

        old_image_url = hero.image_url

        old_files = (
            self.get_local_hero_files()
        )

        self.assertEqual(
            len(old_files),
            1,
        )

        old_file = old_files[0]

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL": "",
            },
            clear=False,
        ):
            with patch.object(
                HomeHeroSerializer,
                "save",
                side_effect=RuntimeError(
                    "Simulation erreur BDD"
                ),
            ):
                with self.assertRaises(
                    RuntimeError
                ):
                    self.client.post(
                        "/api/home-hero/upload/",
                        {
                            "image":
                                self.make_image(
                                    filename="new.png",
                                ),
                            "alt_text":
                                "Nouveau Hero",
                        },
                        format="multipart",
                    )

        hero.refresh_from_db()

        self.assertEqual(
            hero.image_url,
            old_image_url,
        )

        self.assertEqual(
            hero.alt_text,
            "Ancien Hero",
        )

        self.assertTrue(
            old_file.exists()
        )

        files_after_failure = (
            self.get_local_hero_files()
        )

        self.assertEqual(
            files_after_failure,
            [
                old_file
            ],
        )


    def test_admin_uploads_to_cloudinary_when_configured(
        self,
    ):
        cloudinary_result = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "demo/image/upload/"
                "hero-new.jpg"
            ),
            "public_id": (
                "innovevents/home/hero/"
                "hero-new"
            ),
        }

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL":
                    "cloudinary://test",
            },
            clear=False,
        ):
            with patch(
                "events.home_hero_views."
                "HomeHeroViewSet."
                "upload_to_cloudinary",
                return_value=cloudinary_result,
            ) as upload_mock:
                response = self.client.post(
                    "/api/home-hero/upload/",
                    {
                        "image":
                            self.make_image(),
                        "alt_text":
                            "Hero Cloudinary",
                    },
                    format="multipart",
                )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        upload_mock.assert_called_once()

        hero = HomeHero.objects.get(
            pk=1
        )

        self.assertEqual(
            hero.image_url,
            cloudinary_result[
                "secure_url"
            ],
        )

        self.assertEqual(
            hero.cloudinary_public_id,
            cloudinary_result[
                "public_id"
            ],
        )

        self.assertEqual(
            hero.alt_text,
            "Hero Cloudinary",
        )

        self.assertEqual(
            self.get_local_hero_files(),
            [],
        )


    def test_cloudinary_replacement_deletes_previous_public_id_after_success(
        self,
    ):
        HomeHero.objects.create(
            image_url=(
                "https://res.cloudinary.com/"
                "demo/image/upload/"
                "old.jpg"
            ),
            cloudinary_public_id=(
                "innovevents/home/hero/old"
            ),
            alt_text="Ancien Hero",
        )

        cloudinary_result = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "demo/image/upload/"
                "new.jpg"
            ),
            "public_id": (
                "innovevents/home/hero/new"
            ),
        }

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL":
                    "cloudinary://test",
            },
            clear=False,
        ):
            with patch(
                "events.home_hero_views."
                "HomeHeroViewSet."
                "upload_to_cloudinary",
                return_value=cloudinary_result,
            ):
                with patch(
                    "events.home_hero_views."
                    "HomeHeroViewSet."
                    "delete_from_cloudinary",
                ) as delete_mock:
                    response = self.client.post(
                        "/api/home-hero/upload/",
                        {
                            "image":
                                self.make_image(),
                            "alt_text":
                                "Nouveau Hero",
                        },
                        format="multipart",
                    )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        delete_mock.assert_called_once_with(
            "innovevents/home/hero/old"
        )

        hero = HomeHero.objects.get(
            pk=1
        )

        self.assertEqual(
            hero.image_url,
            cloudinary_result[
                "secure_url"
            ],
        )

        self.assertEqual(
            hero.cloudinary_public_id,
            cloudinary_result[
                "public_id"
            ],
        )


    def test_cloudinary_database_failure_deletes_new_media_and_keeps_old_media(
        self,
    ):
        old_image_url = (
            "https://res.cloudinary.com/"
            "demo/image/upload/"
            "old.jpg"
        )

        old_public_id = (
            "innovevents/home/hero/old"
        )

        HomeHero.objects.create(
            image_url=old_image_url,
            cloudinary_public_id=(
                old_public_id
            ),
            alt_text="Ancien Hero",
        )

        new_public_id = (
            "innovevents/home/hero/new"
        )

        cloudinary_result = {
            "secure_url": (
                "https://res.cloudinary.com/"
                "demo/image/upload/"
                "new.jpg"
            ),
            "public_id":
                new_public_id,
        }

        with patch.dict(
            os.environ,
            {
                "CLOUDINARY_URL":
                    "cloudinary://test",
            },
            clear=False,
        ):
            with patch(
                "events.home_hero_views."
                "HomeHeroViewSet."
                "upload_to_cloudinary",
                return_value=cloudinary_result,
            ):
                with patch(
                    "events.home_hero_views."
                    "HomeHeroViewSet."
                    "delete_from_cloudinary",
                ) as delete_mock:
                    with patch.object(
                        HomeHeroSerializer,
                        "save",
                        side_effect=RuntimeError(
                            "Simulation erreur BDD"
                        ),
                    ):
                        with self.assertRaises(
                            RuntimeError
                        ):
                            self.client.post(
                                (
                                    "/api/"
                                    "home-hero/"
                                    "upload/"
                                ),
                                {
                                    "image":
                                        self.make_image(),
                                    "alt_text":
                                        "Nouveau Hero",
                                },
                                format="multipart",
                            )

        delete_mock.assert_called_once_with(
            new_public_id
        )

        hero = HomeHero.objects.get(
            pk=1
        )

        self.assertEqual(
            hero.image_url,
            old_image_url,
        )

        self.assertEqual(
            hero.cloudinary_public_id,
            old_public_id,
        )

        self.assertEqual(
            hero.alt_text,
            "Ancien Hero",
        )