from django.contrib.auth import get_user_model

from rest_framework.exceptions import AuthenticationFailed

from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import (
    api_settings,
)
from rest_framework_simplejwt.utils import (
    get_md5_hash_password,
)


User = get_user_model()


class PasswordAwareTokenRefreshSerializer(
    TokenRefreshSerializer
):
    """
    Refuse un refresh token créé avant
    un changement de mot de passe.

    SimpleJWT 5.5.1 vérifie cette empreinte
    pour les access tokens, mais pas encore
    dans son TokenRefreshSerializer.
    """

    def validate(self, attrs):
        refresh = self.token_class(
            attrs["refresh"]
        )

        user_id = refresh.payload.get(
            api_settings.USER_ID_CLAIM
        )

        if user_id is not None:
            try:
                user = User.objects.get(
                    **{
                        api_settings.USER_ID_FIELD:
                            user_id
                    }
                )

            except User.DoesNotExist:
                raise AuthenticationFailed(
                    "Utilisateur introuvable.",
                    code="user_not_found",
                )

            if (
                api_settings.CHECK_REVOKE_TOKEN
                and refresh.payload.get(
                    api_settings.REVOKE_TOKEN_CLAIM
                )
                != get_md5_hash_password(
                    user.password
                )
            ):
                try:
                    refresh.blacklist()

                except AttributeError:
                    pass

                raise AuthenticationFailed(
                    (
                        "Le mot de passe de "
                        "l'utilisateur a été modifié."
                    ),
                    code="password_changed",
                )

        return super().validate(
            attrs
        )
