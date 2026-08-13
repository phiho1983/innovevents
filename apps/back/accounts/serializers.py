from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Refuse la connexion JWT si l'adresse e-mail
    du compte n'a pas été vérifiée.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.email_verified:
            raise AuthenticationFailed(
                "Adresse e-mail non vérifiée."
            )

        return data


class UserRightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]

        read_only_fields = fields