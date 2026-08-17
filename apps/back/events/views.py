from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from accounts.models import User
from accounts.permissions import IsBusinessAdmin

from .models import Event, HomePhoto
from .serializers import (
    EventSerializer,
    PublicEventSerializer,
    HomePhotoSerializer,
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

        # ADMIN / EMPLOYEE :
        # serializer interne complet.
        if self.is_internal_user():
            return EventSerializer

        # VISITEUR / CLIENT :
        # serializer public limité.
        return PublicEventSerializer

    def get_permissions(self):

        # Lecture autorisée à tous.
        # Le queryset + serializer déterminent ce que
        # chaque rôle a réellement le droit de consulter.
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        # Création / modification / suppression :
        # ADMIN uniquement pour l'instant.
        return [IsBusinessAdmin()]

    def perform_create(self, serializer):
        serializer.save(
            organizer=self.request.user
        )


class HomePhotoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HomePhotoSerializer
    permission_classes = [AllowAny]

    # Les 12 emplacements de la Home doivent être récupérés
    # en une seule requête.
    pagination_class = None

    def get_queryset(self):
        return HomePhoto.objects.all().order_by("slot")