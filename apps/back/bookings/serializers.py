from django.contrib.auth import get_user_model
from django.db.models import Sum

from rest_framework import serializers

from .models import Booking


User = get_user_model()


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = (
            "id",
            "user",
            "status",
            "created_at",
        )

    def validate_quantity(self, value):
        """
        Une réservation doit toujours contenir
        au moins une place.
        """

        if value <= 0:
            raise serializers.ValidationError(
                "La quantité doit être supérieure à 0."
            )

        return value

    @classmethod
    def get_taken_quantity(
        cls,
        event,
        exclude_booking_id=None,
    ):
        """
        Retourne le nombre de places actuellement
        occupées sur un événement.

        Les réservations PENDING et CONFIRMED
        consomment toutes les deux de la capacité.

        Une réservation peut être exclue du calcul
        lors d'une modification.
        """

        queryset = Booking.objects.filter(
            event=event,
            status__in=[
                Booking.Status.PENDING,
                Booking.Status.CONFIRMED,
            ],
        )

        if exclude_booking_id is not None:
            queryset = queryset.exclude(
                pk=exclude_booking_id
            )

        return (
            queryset
            .aggregate(total=Sum("quantity"))
            .get("total")
            or 0
        )

    @classmethod
    def ensure_capacity(
        cls,
        event,
        quantity,
        exclude_booking_id=None,
    ):
        """
        Vérifie qu'un événement possède encore
        suffisamment de places.

        Cette méthode est utilisée :
        - pendant la validation du serializer ;
        - puis une seconde fois sous verrou SQL
          dans BookingViewSet.

        La seconde vérification protège contre
        les réservations concurrentes.
        """

        taken = cls.get_taken_quantity(
            event=event,
            exclude_booking_id=exclude_booking_id,
        )

        remaining = max(
            event.capacity - taken,
            0,
        )

        if quantity > remaining:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        "Capacité insuffisante : "
                        f"il reste {remaining} place(s) "
                        f"sur {event.capacity}."
                    )
                }
            )

        return remaining

    def validate(self, attrs):
        """
        Vérifie :
        - que l'événement existe dans la réservation ;
        - que la quantité est valide ;
        - qu'un CLIENT ne réserve que sur
          un événement public ;
        - qu'il reste suffisamment de places.

        Pour une modification, la réservation
        courante est exclue du calcul afin que
        son ancienne quantité ne soit pas comptée
        deux fois.
        """

        event = attrs.get(
            "event",
            getattr(
                self.instance,
                "event",
                None,
            ),
        )

        if "quantity" in attrs:
            quantity = attrs["quantity"]
        else:
            quantity = getattr(
                self.instance,
                "quantity",
                None,
            )

        if event is None:
            raise serializers.ValidationError(
                {
                    "event":
                        "Événement requis."
                }
            )

        if quantity is None:
            raise serializers.ValidationError(
                {
                    "quantity":
                        "Quantité requise."
                }
            )

        request = self.context.get(
            "request"
        )

        user = (
            request.user
            if request is not None
            else None
        )

        # Un CLIENT ne peut réserver ou déplacer
        # une réservation que vers un événement
        # réellement accessible publiquement.
        #
        # is_staff n'intervient jamais dans
        # cette décision métier.
        if (
            user
            and user.is_authenticated
            and not user.is_superuser
            and user.role == User.Role.CLIENT
            and not event.is_public
        ):
            raise serializers.ValidationError(
                {
                    "event": (
                        "Cet événement n'est pas "
                        "disponible à la réservation."
                    )
                }
            )

        exclude_booking_id = None

        if self.instance is not None:
            exclude_booking_id = (
                self.instance.pk
            )

        self.ensure_capacity(
            event=event,
            quantity=quantity,
            exclude_booking_id=exclude_booking_id,
        )

        return attrs