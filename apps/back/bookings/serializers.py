from rest_framework import serializers
from django.db.models import Sum

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ("id", "user", "status", "created_at")

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0.")
        return value

    def validate(self, attrs):
        # event/quantity depuis le payload, ou depuis l'instance (si update)
        event = attrs.get("event") or getattr(self.instance, "event", None)
        qty = attrs.get("quantity") if "quantity" in attrs else getattr(self.instance, "quantity", None)

        if event is None:
            raise serializers.ValidationError({"event": "Événement requis."})
        if qty is None:
            raise serializers.ValidationError({"quantity": "Quantité requise."})

        # total pris (PENDING + CONFIRMED)
        taken = (
            Booking.objects
            .filter(event=event, status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED])
            .aggregate(total=Sum("quantity"))
            .get("total") or 0
        )

        # si modification d'une réservation déjà "bloquante", on retire l'ancienne quantité
        if self.instance and self.instance.status in (Booking.Status.PENDING, Booking.Status.CONFIRMED):
            taken -= self.instance.quantity

        remaining = event.capacity - taken

        if qty > remaining:
            raise serializers.ValidationError({
                "quantity": f"Capacité insuffisante : il reste {remaining} place(s) sur {event.capacity}."
            })

        return attrs
