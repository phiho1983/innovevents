from rest_framework import serializers

from .models import Event, HomePhoto


class PublicEventSerializer(serializers.ModelSerializer):
    """
    Serializer destiné aux visiteurs et utilisateurs non internes.

    Il n'expose que les informations nécessaires à l'affichage public
    d'un événement.
    """

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
            "event_type",
            "theme",
            "image",
        )
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer interne utilisé pour la gestion des événements.

    Les changements de statut d'un événement existant
    doivent passer par les actions métier dédiées
    et non par un PATCH direct.
    """

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = (
            "id",
            "organizer",
            "created_at",
        )

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La capacité doit être supérieure à 0."
            )

        return value

    def validate(self, attrs):
        """
        Vérifie :
        - qu'un statut existant n'est pas modifié
          directement par PATCH/PUT ;
        - la cohérence chronologique de l'événement.
        """

        if (
            self.instance is not None
            and "status" in self.initial_data
        ):
            raise serializers.ValidationError(
                {
                    "status": (
                        "Le statut d'un événement "
                        "doit être modifié via "
                        "une action métier dédiée."
                    )
                }
            )

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