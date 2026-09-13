import os
import uuid

from urllib.parse import urlparse

from PIL import Image, UnidentifiedImageError

from django.conf import settings
from django.core.files.storage import default_storage

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import (
    IsBusinessAdmin,
    IsInternalUser,
)

from .models import Event, HomePhoto
from .serializers import (
    EventSerializer,
    PublicEventSerializer,
    HomePhotoSerializer,
)

from .upload_security import (
    validate_uploaded_image_file,
)


class EventViewSet(viewsets.ModelViewSet):

    def is_internal_user(self):
        user = self.request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role in (
                    User.Role.ADMIN,
                    User.Role.EMPLOYEE,
                )
            )
        )

    def get_queryset(self):
        qs = Event.objects.all().order_by("start_at")

        # VISITEUR et CLIENT :
        # uniquement les événements réellement publics.
        #
        # ADMIN et EMPLOYEE :
        # accès à tous les événements.
        if not self.is_internal_user():
            qs = (
                qs.filter(
                    visible=True,
                    client_agreed=True,
                )
                .exclude(
                    status=Event.Status.DRAFT,
                )
            )

        event_type = self.request.query_params.get("event_type")
        if event_type:
            qs = qs.filter(event_type=event_type)

        theme = self.request.query_params.get("theme")
        if theme:
            qs = qs.filter(theme__icontains=theme)

        start_after = self.request.query_params.get("start_after")
        if start_after:
            qs = qs.filter(start_at__date__gte=start_after)

        start_before = self.request.query_params.get("start_before")
        if start_before:
            qs = qs.filter(start_at__date__lte=start_before)

        upcoming = self.request.query_params.get("upcoming")
        if upcoming:
            qs = qs.order_by("start_at")[:int(upcoming)]

        return qs

    def get_serializer_class(self):

        # Espace privé du CLIENT :
        # serializer interne complet.
        if self.action == "mine":
            return EventSerializer

        # ADMIN / EMPLOYEE :
        # serializer interne complet.
        if self.is_internal_user():
            return EventSerializer

        # VISITEUR / CLIENT :
        # serializer public limité.
        return PublicEventSerializer

    def get_permissions(self):

        # Événements privés du client :
        # authentification obligatoire.
        if self.action == "mine":
            return [
                IsAuthenticated()
            ]

        # Cycle de réalisation :
        # ADMIN et EMPLOYEE.
        if self.action in [
            "start",
            "complete",
        ]:
            return [
                IsInternalUser()
            ]

        # Lecture autorisée à tous.
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [
                AllowAny()
            ]

        # Suppression :
        # ADMIN uniquement.
        if self.action == "destroy":
            return [
                IsBusinessAdmin()
            ]

        # Exploitation métier :
        # ADMIN et EMPLOYEE peuvent créer
        # et modifier les événements.
        if self.action in [
            "create",
            "update",
            "partial_update",
        ]:
            return [
                IsInternalUser()
            ]

        # Toute action non prévue reste
        # réservée à l'ADMIN.
        return [
            IsBusinessAdmin()
        ]

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
    )
    def mine(self, request):
        """
        Retourne uniquement les événements métier privés
        appartenant au client connecté.

        Les règles de publication de la vitrine
        ne s'appliquent pas à cette route.
        """

        queryset = (
            Event.objects
            .filter(client=request.user)
            .order_by("start_at")
        )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(
                page,
                many=True,
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)

    def get_private_event_for_transition(
        self,
        expected_status,
    ):
        """
        Retourne un événement privé client
        uniquement s'il se trouve dans le statut
        attendu pour la transition demandée.

        Les événements vitrine ne participent
        jamais au cycle de réalisation client.
        """

        event = self.get_object()

        if event.client_id is None:
            raise ValidationError(
                {
                    "detail": (
                        "Le cycle de réalisation "
                        "est réservé aux événements "
                        "privés d'un client."
                    )
                }
            )

        if event.status != expected_status:
            raise ValidationError(
                {
                    "detail": (
                        "Transition de statut "
                        "non autorisée pour cet événement."
                    )
                }
            )

        return event

    @action(
        detail=True,
        methods=["post"],
        url_path="start",
    )
    def start(
        self,
        request,
        pk=None,
    ):
        """
        Démarre la réalisation d'un événement.

        Transition autorisée :
        ACCEPTED -> IN_PROGRESS
        """

        event = (
            self.get_private_event_for_transition(
                Event.Status.ACCEPTED
            )
        )

        event.status = (
            Event.Status.IN_PROGRESS
        )

        event.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "status":
                    event.status
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="complete",
    )
    def complete(
        self,
        request,
        pk=None,
    ):
        """
        Termine la réalisation d'un événement.

        Transition autorisée :
        IN_PROGRESS -> DONE
        """

        event = (
            self.get_private_event_for_transition(
                Event.Status.IN_PROGRESS
            )
        )

        event.status = (
            Event.Status.DONE
        )

        event.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "status":
                    event.status
            }
        )

    def perform_create(self, serializer):
        serializer.save(
            organizer=self.request.user
        )


class HomePhotoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Gestion des 12 emplacements du carrousel Home.

    Lecture :
    - publique.

    Modification / upload :
    - ADMIN uniquement.

    Stockage :
    - local lorsque CLOUDINARY_URL est absente ;
    - Cloudinary lorsqu'elle est présente.

    Remplacement :
    - la nouvelle image est enregistrée en premier ;
    - la BDD est ensuite mise à jour ;
    - l'ancien média est supprimé uniquement après succès ;
    - si la mise à jour BDD échoue, le nouveau média
      est supprimé et l'ancien reste intact.
    """

    serializer_class = HomePhotoSerializer
    pagination_class = None

    def get_queryset(self):
        return HomePhoto.objects.all().order_by("slot")

    def get_permissions(self):
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [
                AllowAny()
            ]

        return [
            IsBusinessAdmin()
        ]

    def validate_uploaded_image(
        self,
        uploaded_file,
    ):
        return validate_uploaded_image_file(
            uploaded_file
        )

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
            folder="innovevents/home/carousel",
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
            "home/carousel/"
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
            # Le remplacement reste réussi même si
            # le nettoyage de l'ancien fichier échoue.
            pass

    def cleanup_new_media_after_failure(
        self,
        use_cloudinary,
        saved_name,
        public_id,
    ):
        """
        Si l'enregistrement BDD échoue après avoir
        créé le nouveau média, supprimer ce nouveau
        média pour éviter un fichier orphelin.
        """

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
        """
        Supprime l'ancien média uniquement après
        réussite du nouvel upload et de la mise à jour BDD.
        """

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
        detail=True,
        methods=["post"],
        url_path="upload",
    )
    def upload(
        self,
        request,
        pk=None,
    ):
        photo = self.get_object()

        old_image_url = (
            photo.image_url
        )

        old_public_id = (
            photo.cloudinary_public_id
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
            photo,
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