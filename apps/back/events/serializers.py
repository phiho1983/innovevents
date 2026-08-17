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
        if value <= 0:
            raise serializers.ValidationError(
                "La capacité doit être supérieure à 0."
            )

        # Lors d'une modification, empêcher de réduire la capacité
        # sous le nombre de places déjà réservées.
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


class HomePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePhoto
        fields = "__all__"