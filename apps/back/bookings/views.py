from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import status as http_status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsBusinessAdmin
from events.models import Event

from .models import Booking
from .serializers import BookingSerializer


User = get_user_model()


class BookingViewSet(ModelViewSet):
    """
    Gestion des réservations.

    CLIENT :
    - voit uniquement ses propres réservations
    - peut créer une réservation
    - peut gérer ses propres réservations
    - peut annuler ses propres réservations

    EMPLOYEE :
    - voit toutes les réservations
    - peut intervenir sur les réservations accessibles
    - ne peut pas confirmer une réservation

    ADMIN :
    - voit toutes les réservations
    - peut confirmer une réservation

    Les droits métier reposent sur User.role
    et non sur is_staff.
    """

    serializer_class = BookingSerializer
    permission_classes = [
        IsAuthenticated
    ]

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
        queryset = (
            Booking.objects
            .all()
            .order_by("-created_at")
        )

        # ADMIN / EMPLOYEE :
        # accès à toutes les réservations.
        if self.is_internal_user():
            return queryset

        # CLIENT :
        # uniquement ses propres réservations.
        return queryset.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        """
        Création transactionnelle d'une réservation.

        Le client ne peut jamais injecter :
        - un autre utilisateur ;
        - un statut CONFIRMED.

        L'événement est verrouillé avec SELECT FOR UPDATE
        pendant la dernière vérification de capacité.

        Deux créations simultanées pour le même événement
        ne peuvent donc pas toutes les deux se baser
        sur la même capacité disponible.
        """

        event = serializer.validated_data[
            "event"
        ]

        quantity = serializer.validated_data[
            "quantity"
        ]

        with transaction.atomic():
            locked_event = (
                Event.objects
                .select_for_update()
                .get(pk=event.pk)
            )

            BookingSerializer.ensure_capacity(
                event=locked_event,
                quantity=quantity,
            )

            serializer.save(
                event=locked_event,
                user=self.request.user,
                status=Booking.Status.PENDING,
            )

    def perform_update(self, serializer):
        """
        Modification transactionnelle.

        La réservation courante est verrouillée.

        Les événements concernés sont ensuite verrouillés
        dans un ordre déterministe afin de réduire
        les risques de deadlock.

        La capacité est recalculée à l'intérieur
        de la transaction avant l'enregistrement.
        """

        booking_id = (
            serializer.instance.pk
        )

        requested_event = (
            serializer.validated_data
            .get("event")
        )

        requested_quantity = (
            serializer.validated_data
            .get("quantity")
        )

        with transaction.atomic():
            locked_booking = (
                Booking.objects
                .select_for_update()
                .get(pk=booking_id)
            )

            if requested_event is not None:
                target_event_id = (
                    requested_event.pk
                )
            else:
                target_event_id = (
                    locked_booking.event_id
                )

            event_ids = sorted(
                {
                    locked_booking.event_id,
                    target_event_id,
                }
            )

            locked_events = {
                event.pk: event
                for event in (
                    Event.objects
                    .select_for_update()
                    .filter(pk__in=event_ids)
                    .order_by("pk")
                )
            }

            target_event = (
                locked_events[
                    target_event_id
                ]
            )

            if requested_quantity is not None:
                quantity = (
                    requested_quantity
                )
            else:
                quantity = (
                    locked_booking.quantity
                )

            BookingSerializer.ensure_capacity(
                event=target_event,
                quantity=quantity,
                exclude_booking_id=(
                    locked_booking.pk
                ),
            )

            serializer.instance = (
                locked_booking
            )

            serializer.save(
                event=target_event
            )

    @action(
        detail=True,
        methods=["post"],
    )
    def cancel(
        self,
        request,
        pk=None,
    ):
        """
        Un CLIENT ne peut annuler que sa propre
        réservation grâce au get_queryset().

        ADMIN / EMPLOYEE peuvent accéder aux
        réservations internes.
        """

        booking = self.get_object()

        if (
            booking.status
            == Booking.Status.CANCELLED
        ):
            return Response(
                {
                    "detail":
                        "Réservation déjà annulée."
                },
                status=(
                    http_status.HTTP_400_BAD_REQUEST
                ),
            )

        booking.status = (
            Booking.Status.CANCELLED
        )

        booking.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "detail":
                    "Réservation annulée."
            },
            status=http_status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            IsBusinessAdmin
        ],
    )
    def confirm(
        self,
        request,
        pk=None,
    ):
        """
        Confirmation réservée aux ADMIN métier.

        is_staff n'accorde aucun droit ici.
        """

        booking = self.get_object()

        if (
            booking.status
            == Booking.Status.CANCELLED
        ):
            return Response(
                {
                    "detail": (
                        "Impossible de confirmer "
                        "une réservation annulée."
                    )
                },
                status=(
                    http_status.HTTP_400_BAD_REQUEST
                ),
            )

        if (
            booking.status
            == Booking.Status.CONFIRMED
        ):
            return Response(
                {
                    "detail":
                        "Réservation déjà confirmée."
                },
                status=(
                    http_status.HTTP_400_BAD_REQUEST
                ),
            )

        booking.status = (
            Booking.Status.CONFIRMED
        )

        booking.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "detail":
                    "Réservation confirmée."
            },
            status=http_status.HTTP_200_OK,
        )