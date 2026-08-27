from rest_framework import viewsets
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


class HomePhotoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HomePhotoSerializer
    permission_classes = [AllowAny]

    # Les 12 emplacements de la Home doivent être récupérés
    # en une seule requête.
    pagination_class = None

    def get_queryset(self):
        return HomePhoto.objects.all().order_by("slot")