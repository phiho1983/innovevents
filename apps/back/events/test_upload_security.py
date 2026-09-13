from unittest.mock import (
    MagicMock,
    patch,
)

from django.core.files.uploadedfile import (
    SimpleUploadedFile,
)
from django.test import SimpleTestCase

from PIL import Image

from rest_framework.exceptions import (
    ValidationError,
)

from events.home_hero_views import (
    HomeHeroViewSet,
)
from events.views import (
    HomePhotoViewSet,
)


FIVE_MB = 5 * 1024 * 1024


class UploadSecurityTests(
    SimpleTestCase
):
    def make_large_file(self):
        return SimpleUploadedFile(
            "large.png",
            b"x" * (
                FIVE_MB + 1
            ),
            content_type="image/png",
        )

    def make_small_fake_file(self):
        return SimpleUploadedFile(
            "fake.png",
            b"fake-image-data",
            content_type="image/png",
        )

    def assert_size_error(
        self,
        validator,
    ):
        with self.assertRaises(
            ValidationError
        ) as context:
            validator(
                self.make_large_file()
            )

        self.assertIn(
            "5 Mo",
            str(
                context.exception.detail
            ),
        )

    def test_home_photo_rejects_file_larger_than_5_mb(
        self,
    ):
        view = HomePhotoViewSet()

        self.assert_size_error(
            view.validate_uploaded_image
        )

    def test_home_hero_rejects_file_larger_than_5_mb(
        self,
    ):
        view = HomeHeroViewSet()

        self.assert_size_error(
            view.validate_uploaded_image
        )

    @patch(
        "events.views.Image.open"
    )
    def test_home_photo_rejects_excessive_pixel_count(
        self,
        mocked_open,
    ):
        image = MagicMock()

        image.format = "PNG"
        image.size = (
            6000,
            5000,
        )

        mocked_open.return_value = (
            image
        )

        view = HomePhotoViewSet()

        with self.assertRaises(
            ValidationError
        ):
            view.validate_uploaded_image(
                self.make_small_fake_file()
            )

    @patch(
        "events.home_hero_views.Image.open"
    )
    def test_home_hero_rejects_excessive_pixel_count(
        self,
        mocked_open,
    ):
        image = MagicMock()

        image.format = "PNG"
        image.size = (
            6000,
            5000,
        )

        mocked_open.return_value = (
            image
        )

        view = HomeHeroViewSet()

        with self.assertRaises(
            ValidationError
        ):
            view.validate_uploaded_image(
                self.make_small_fake_file()
            )

    @patch(
        "events.views.Image.open",
        side_effect=(
            Image.DecompressionBombError(
                "image trop grande"
            )
        ),
    )
    def test_home_photo_converts_decompression_bomb_to_validation_error(
        self,
        mocked_open,
    ):
        view = HomePhotoViewSet()

        with self.assertRaises(
            ValidationError
        ):
            view.validate_uploaded_image(
                self.make_small_fake_file()
            )

        mocked_open.assert_called_once()

    @patch(
        "events.home_hero_views.Image.open",
        side_effect=(
            Image.DecompressionBombError(
                "image trop grande"
            )
        ),
    )
    def test_home_hero_converts_decompression_bomb_to_validation_error(
        self,
        mocked_open,
    ):
        view = HomeHeroViewSet()

        with self.assertRaises(
            ValidationError
        ):
            view.validate_uploaded_image(
                self.make_small_fake_file()
            )

        mocked_open.assert_called_once()