from rest_framework import serializers

from events.models import Event

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Review
        fields = (
            "id",
            "event",
            "author",
            "author_name",
            "rating",
            "content",
            "created_at",
        )

        read_only_fields = (
            "id",
            "author",
            "author_name",
            "created_at",
        )

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.get_username()

    def validate_event(self, event):
        request = self.context.get("request")

        if event.status != Event.Status.DONE:
            raise serializers.ValidationError(
                "Un avis ne peut être publié que pour un événement terminé."
            )

        if request is None or event.client != request.user:
            raise serializers.ValidationError(
                "Vous ne pouvez publier un avis que pour votre propre événement."
            )

        if Review.objects.filter(event=event).exists():
            raise serializers.ValidationError(
                "Un avis a déjà été publié pour cet événement."
            )

        return event

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                "La note doit être comprise entre 1 et 5."
            )

        return value

    def validate_content(self, value):
        value = (value or "").strip()

        if len(value) < 10:
            raise serializers.ValidationError(
                "Votre avis doit contenir au moins 10 caractères."
            )

        return value