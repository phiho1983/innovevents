from django.contrib.auth import get_user_model

from rest_framework import status as http_status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsBusinessAdmin

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
    permission_classes = [IsAuthenticated]

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
        queryset = Booking.objects.all().order_by(
            "-created_at"
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
        La réservation appartient toujours
        à l'utilisateur authentifié.

        Le client ne peut donc jamais injecter
        un autre user dans le payload.
        """

        serializer.save(
            user=self.request.user,
            status=Booking.Status.PENDING,
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