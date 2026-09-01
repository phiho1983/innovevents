from rest_framework import serializers

from .models import HomeHero


class HomeHeroSerializer(serializers.ModelSerializer):
    cloudinary_public_id = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = HomeHero

        fields = (
            "id",
            "image_url",
            "cloudinary_public_id",
            "alt_text",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "updated_at",
        )