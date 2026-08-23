from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import ValidationError
from django.db import transaction

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from config.mongo import log_action

from .services import (
    check_account_activation_token,
)
from .throttles import (
    AccountActivationRateThrottle,
)


User = get_user_model()


def activation_error_response():
    return Response(
        {
            "detail": (
                "Lien d'activation "
                "invalide ou expiré."
            )
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([
    AccountActivationRateThrottle
])
def activate_account(request):
    """
    Finalise la première activation
    d'un client créé depuis un prospect.

    Body :

    {
        "uid": 123,
        "token": "...",
        "password": "..."
    }

    Le token n'est consommé qu'une fois
    le mot de passe validé et enregistré.
    """

    uid = request.data.get(
        "uid"
    )

    token = (
        request.data.get("token")
        or ""
    ).strip()

    password = (
        request.data.get("password")
        or ""
    )

    try:
        user_id = int(uid)

    except (
        TypeError,
        ValueError,
    ):
        return (
            activation_error_response()
        )

    if not token:
        return (
            activation_error_response()
        )

    if not password:
        return Response(
            {
                "password": [
                    "Obligatoire."
                ]
            },
            status=(
                status
                .HTTP_400_BAD_REQUEST
            ),
        )

    user = (
        User.objects
        .filter(
            pk=user_id,
            is_active=True,
        )
        .first()
    )

    if user is None:
        return (
            activation_error_response()
        )

    if (
        user.email_verified
        or user.has_usable_password()
    ):
        return (
            activation_error_response()
        )

    valid, _ = (
        check_account_activation_token(
            user,
            token,
            consume=False,
        )
    )

    if not valid:
        return (
            activation_error_response()
        )

    try:
        validate_password(
            password,
            user=user,
        )

    except ValidationError as exc:
        return Response(
            {
                "password":
                    list(
                        exc.messages
                    )
            },
            status=(
                status
                .HTTP_400_BAD_REQUEST
            ),
        )

    with transaction.atomic():
        locked_user = (
            User.objects
            .select_for_update()
            .filter(
                pk=user.id,
                is_active=True,
            )
            .first()
        )

        if locked_user is None:
            return (
                activation_error_response()
            )

        if (
            locked_user.email_verified
            or locked_user
                .has_usable_password()
        ):
            return (
                activation_error_response()
            )

        valid, _ = (
            check_account_activation_token(
                locked_user,
                token,
                consume=True,
                lock=True,
            )
        )

        if not valid:
            return (
                activation_error_response()
            )

        locked_user.set_password(
            password
        )

        locked_user.email_verified = True
        locked_user.must_change_password = False

        locked_user.save(
            update_fields=[
                "password",
                "email_verified",
                "must_change_password",
            ]
        )

    log_action(
        "COMPTE_CLIENT_ACTIVE",
        locked_user.id,
        {
            "username":
                locked_user.username,
            "email":
                locked_user.email,
        },
    )

    refresh = RefreshToken.for_user(
        locked_user
    )

    return Response(
        {
            "detail": (
                "Compte activé "
                "avec succès."
            ),
            "username":
                locked_user.username,
            "access": str(
                refresh.access_token
            ),
            "refresh": str(
                refresh
            ),
        },
        status=status.HTTP_200_OK,
    )