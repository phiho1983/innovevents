from rest_framework import serializers
from django.db.models import Sum

from .models import Event
from bookings.models import Booking  # adapte le chemin si besoin


class EventSerializer(serializers.ModelSerializer):
    remaining_capacity = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ("id", "organizer")

    def get_remaining_capacity(self, obj):
        return obj.remaining_capacity()

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La capacité doit être supérieure à 0.")

        # Si update : empêcher capacity < places déjà prises (PENDING + CONFIRMED)
        if self.instance:
            taken = (
                Booking.objects
                .filter(
                    event=self.instance,
                    status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
                )
                .aggregate(total=Sum("quantity"))
                .get("total") or 0
            )

            if value < taken:
                raise serializers.ValidationError(
                    f"Impossible de réduire la capacité à {value} : {taken} place(s) déjà réservée(s)."
                )

        return value
