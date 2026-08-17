from django.db.models import Sum
from rest_framework import serializers

from bookings.models import Booking

from .models import Event, HomePhoto


class PublicEventSerializer(serializers.ModelSerializer):
    """
    Serializer destiné aux visiteurs et utilisateurs non internes.

    Il n'expose que les informations nécessaires à l'affichage public
    d'un événement.
    """

    remaining_capacity = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "description",
            "city",
            "start_at",
            "end_at",
            "capacity",
            "remaining_capacity",
            "event_type",
            "theme",
            "image",
        )
        read_only_fields = fields

    def get_remaining_capacity(self, obj):
        return obj.remaining_capacity()


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer interne utilisé pour la gestion des événements.
    """

    remaining_capacity = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = (
            "id",
            "organizer",
            "created_at",
            "remaining_capacity",
        )

    def get_remaining_capacity(self, obj):
        return obj.remaining_capacity()

    def validate_capacity(self, value):
        """
        La capacité d'un événement doit toujours
        être strictement supérieure à zéro.

        Lors d'une modification, elle ne peut pas
        devenir inférieure au nombre de places
        déjà réservées.
        """

        if value <= 0:
            raise serializers.ValidationError(
                "La capacité doit être supérieure à 0."
            )

        if self.instance:
            taken = (
                Booking.objects
                .filter(
                    event=self.instance,
                    status__in=[
                        Booking.Status.PENDING,
                        Booking.Status.CONFIRMED,
                    ],
                )
                .aggregate(total=Sum("quantity"))
                .get("total")
                or 0
            )

            if value < taken:
                raise serializers.ValidationError(
                    f"Impossible de réduire la capacité à {value} : "
                    f"{taken} place(s) déjà réservée(s)."
                )

        return value

    def validate(self, attrs):
        """
        Vérifie la cohérence chronologique
        de l'événement.

        end_at reste facultatif.

        S'il est renseigné, il doit obligatoirement
        être postérieur à start_at.
        """

        start_at = attrs.get(
            "start_at",
            getattr(
                self.instance,
                "start_at",
                None,
            ),
        )

        end_at = attrs.get(
            "end_at",
            getattr(
                self.instance,
                "end_at",
                None,
            ),
        )

        if (
            start_at is not None
            and end_at is not None
            and end_at <= start_at
        ):
            raise serializers.ValidationError(
                {
                    "end_at": (
                        "La date de fin doit être "
                        "postérieure à la date de début."
                    )
                }
            )

        return attrs


class HomePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePhoto
        fields = "__all__"