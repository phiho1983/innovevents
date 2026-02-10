from rest_framework import serializers
from .models import Event


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
        return value
