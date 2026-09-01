import os
import uuid

from urllib.parse import urlparse

from PIL import Image, UnidentifiedImageError

from django.conf import settings
from django.core.files.storage import default_storage

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.permissions import IsBusinessAdmin

from .models import HomeHero
from .home_hero_serializers import HomeHeroSerializer


class HomeHeroViewSet(viewsets.GenericViewSet):
    """
    Gestion de l'image principale de la Home.

    GET /api/home-hero/
        Lecture publique.

    POST /api/home-hero/upload/
        Upload réservé à l'ADMIN.

    Stockage :
        local sans CLOUDINARY_URL ;
        Cloudinary avec CLOUDINARY_URL.

    Remplacement :
        le nouveau média est créé avant
        de supprimer l'ancien.
    """

    serializer_class = HomeHeroSerializer


    def get_permissions(self):
        if self.action == "list":
            return [
                AllowAny()
            ]

        return [
            IsBusinessAdmin()
        ]


    def list(self, request):
        hero = (
            HomeHero.objects
            .first()
        )

        if hero is None:
            return Response(
                {
                    "id": None,
                    "image_url": "",
                    "alt_text": "",
                    "updated_at": None,
                }
            )

        serializer = self.get_serializer(
            hero
        )

        return Response(
            serializer.data
        )


    def validate_uploaded_image(
        self,
        uploaded_file,
    ):
        if uploaded_file is None:
            raise ValidationError(
                {
                    "image": (
                        "Veuillez sélectionner "
                        "une image."
                    )
                }
            )

        image_format = None

        try:
            image = Image.open(
                uploaded_file
            )

            image_format = (
                image.format or ""
            ).upper()

            image.verify()

        except (
            UnidentifiedImageError,
            OSError,
            ValueError,
        ):
            raise ValidationError(
                {
                    "image": (
                        "Le fichier envoyé "
                        "n'est pas une image valide."
                    )
                }
            )

        finally:
            try:
                uploaded_file.seek(0)
            except (
                AttributeError,
                OSError,
            ):
                pass

        allowed_formats = {
            "JPEG": "jpg",
            "PNG": "png",
            "WEBP": "webp",
        }

        if image_format not in allowed_formats:
            raise ValidationError(
                {
                    "image": (
                        "Format d'image non autorisé. "
                        "Formats acceptés : "
                        "JPEG, PNG, WEBP."
                    )
                }
            )

        return allowed_formats[
            image_format
        ]


    def should_use_cloudinary(self):
        return bool(
            os.getenv(
                "CLOUDINARY_URL",
                "",
            ).strip()
        )


    def upload_to_cloudinary(
        self,
        uploaded_file,
    ):
        import cloudinary.uploader

        return cloudinary.uploader.upload(
            uploaded_file,
            folder=(
                "innovevents/home/hero"
            ),
            resource_type="image",
        )


    def delete_from_cloudinary(
        self,
        public_id,
    ):
        if not public_id:
            return

        import cloudinary.uploader

        cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            invalidate=True,
        )


    def upload_to_local_storage(
        self,
        uploaded_file,
        extension,
    ):
        filename = (
            "home/hero/"
            f"{uuid.uuid4().hex}."
            f"{extension}"
        )

        return default_storage.save(
            filename,
            uploaded_file,
        )


    def get_local_storage_name_from_url(
        self,
        image_url,
    ):
        if not image_url:
            return None

        path = urlparse(
            image_url
        ).path

        media_url = (
            settings.MEDIA_URL
            or "/media/"
        )

        if not media_url.startswith("/"):
            media_url = (
                f"/{media_url}"
            )

        if not media_url.endswith("/"):
            media_url = (
                f"{media_url}/"
            )

        if not path.startswith(
            media_url
        ):
            return None

        storage_name = path[
            len(media_url):
        ].lstrip("/")

        return storage_name or None


    def delete_local_file(
        self,
        storage_name,
    ):
        if not storage_name:
            return

        try:
            if default_storage.exists(
                storage_name
            ):
                default_storage.delete(
                    storage_name
                )

        except OSError:
            pass


    def cleanup_new_media_after_failure(
        self,
        use_cloudinary,
        saved_name,
        public_id,
    ):
        if use_cloudinary:
            if public_id:
                try:
                    self.delete_from_cloudinary(
                        public_id
                    )
                except Exception:
                    pass

            return

        if saved_name:
            self.delete_local_file(
                saved_name
            )


    def cleanup_previous_media(
        self,
        old_image_url,
        old_public_id,
        new_image_url,
        new_public_id,
    ):
        if old_public_id:
            if (
                old_public_id
                != new_public_id
            ):
                try:
                    self.delete_from_cloudinary(
                        old_public_id
                    )
                except Exception:
                    pass

            return

        old_storage_name = (
            self.get_local_storage_name_from_url(
                old_image_url
            )
        )

        new_storage_name = (
            self.get_local_storage_name_from_url(
                new_image_url
            )
        )

        if (
            old_storage_name
            and old_storage_name
            != new_storage_name
        ):
            self.delete_local_file(
                old_storage_name
            )


    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
    )
    def upload(
        self,
        request,
    ):
        hero, _ = (
            HomeHero.objects
            .get_or_create(
                pk=1
            )
        )

        old_image_url = (
            hero.image_url
        )

        old_public_id = (
            hero.cloudinary_public_id
        )

        uploaded_file = (
            request.FILES.get(
                "image"
            )
        )

        extension = (
            self.validate_uploaded_image(
                uploaded_file
            )
        )

        use_cloudinary = (
            self.should_use_cloudinary()
        )

        saved_name = None
        image_url = ""
        public_id = ""

        if use_cloudinary:
            cloudinary_result = (
                self.upload_to_cloudinary(
                    uploaded_file
                )
            )

            image_url = (
                cloudinary_result.get(
                    "secure_url"
                )
            )

            public_id = (
                cloudinary_result.get(
                    "public_id"
                )
            )

            if (
                not image_url
                or not public_id
            ):
                if public_id:
                    try:
                        self.delete_from_cloudinary(
                            public_id
                        )
                    except Exception:
                        pass

                raise ValidationError(
                    {
                        "image": (
                            "Le stockage de l'image "
                            "n'a pas retourné les "
                            "informations attendues."
                        )
                    }
                )

        else:
            saved_name = (
                self.upload_to_local_storage(
                    uploaded_file,
                    extension,
                )
            )

            local_url = (
                default_storage.url(
                    saved_name
                )
            )

            image_url = (
                request.build_absolute_uri(
                    local_url
                )
            )

            public_id = ""

        update_data = {
            "image_url":
                image_url,
            "cloudinary_public_id":
                public_id,
        }

        if "alt_text" in request.data:
            update_data[
                "alt_text"
            ] = request.data.get(
                "alt_text",
                "",
            )

        serializer = self.get_serializer(
            hero,
            data=update_data,
            partial=True,
        )

        try:
            serializer.is_valid(
                raise_exception=True
            )

            serializer.save()

        except Exception:
            self.cleanup_new_media_after_failure(
                use_cloudinary=use_cloudinary,
                saved_name=saved_name,
                public_id=public_id,
            )

            raise

        self.cleanup_previous_media(
            old_image_url=old_image_url,
            old_public_id=old_public_id,
            new_image_url=image_url,
            new_public_id=public_id,
        )

        return Response(
            serializer.data
        )