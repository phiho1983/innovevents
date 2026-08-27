from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
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