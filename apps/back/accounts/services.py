import secrets
from datetime import timedelta

from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.utils import timezone

from .models import VerificationCode


CODE_TTL_MINUTES = 10
ACTIVATION_TOKEN_TTL_HOURS = 24
MAX_ATTEMPTS = 5


def create_verification_code(user, purpose):
    now = timezone.now()

    VerificationCode.objects.filter(
        user=user,
        purpose=purpose,
        used_at__isnull=True,
    ).update(
        used_at=now
    )

    raw_code = (
        f"{secrets.randbelow(1_000_000):06d}"
    )

    verification_code = (
        VerificationCode.objects.create(
            user=user,
            purpose=purpose,
            code_hash=make_password(
                raw_code
            ),
            expires_at=(
                now
                + timedelta(
                    minutes=CODE_TTL_MINUTES
                )
            ),
        )
    )

    return (
        raw_code,
        verification_code,
    )


def check_verification_code(
    user,
    purpose,
    raw_code,
    consume=True,
):
    verification_code = (
        VerificationCode.objects
        .filter(
            user=user,
            purpose=purpose,
            used_at__isnull=True,
        )
        .order_by(
            "-created_at"
        )
        .first()
    )

    if verification_code is None:
        return (
            False,
            "NO_ACTIVE_CODE",
        )

    now = timezone.now()

    if (
        verification_code.expires_at
        <= now
    ):
        verification_code.used_at = now

        verification_code.save(
            update_fields=[
                "used_at"
            ]
        )

        return (
            False,
            "EXPIRED",
        )

    if (
        verification_code.attempts
        >= MAX_ATTEMPTS
    ):
        verification_code.used_at = now

        verification_code.save(
            update_fields=[
                "used_at"
            ]
        )

        return (
            False,
            "TOO_MANY_ATTEMPTS",
        )

    if not check_password(
        str(raw_code),
        verification_code.code_hash,
    ):
        verification_code.attempts += 1

        update_fields = [
            "attempts"
        ]

        if (
            verification_code.attempts
            >= MAX_ATTEMPTS
        ):
            verification_code.used_at = now

            update_fields.append(
                "used_at"
            )

        verification_code.save(
            update_fields=
                update_fields
        )

        return (
            False,
            "INVALID_CODE",
        )

    if consume:
        verification_code.used_at = now

        verification_code.save(
            update_fields=[
                "used_at"
            ]
        )

    return (
        True,
        "OK",
    )


def create_account_activation_token(
    user
):
    """
    Crée un token d'activation long,
    aléatoire et à usage unique.

    Le token brut n'est jamais stocké
    en base de données.
    """

    now = timezone.now()

    VerificationCode.objects.filter(
        user=user,
        purpose=(
            VerificationCode
            .Purpose
            .ACCOUNT_ACTIVATION
        ),
        used_at__isnull=True,
    ).update(
        used_at=now
    )

    raw_token = (
        secrets.token_urlsafe(48)
    )

    activation_token = (
        VerificationCode.objects.create(
            user=user,
            purpose=(
                VerificationCode
                .Purpose
                .ACCOUNT_ACTIVATION
            ),
            code_hash=make_password(
                raw_token
            ),
            expires_at=(
                now
                + timedelta(
                    hours=
                        ACTIVATION_TOKEN_TTL_HOURS
                )
            ),
        )
    )

    return (
        raw_token,
        activation_token,
    )


def check_account_activation_token(
    user,
    raw_token,
    consume=True,
    lock=False,
):
    """
    Vérifie un token d'activation.

    Contrairement aux codes à 6 chiffres,
    le token possède une forte entropie.

    Une tentative invalide ne détruit donc
    pas le token afin d'éviter qu'un tiers
    puisse volontairement bloquer
    l'activation d'un compte.

    Le throttling de l'endpoint protège
    les tentatives répétées.
    """

    queryset = (
        VerificationCode.objects
    )

    if lock:
        queryset = (
            queryset.select_for_update()
        )

    activation_token = (
        queryset
        .filter(
            user=user,
            purpose=(
                VerificationCode
                .Purpose
                .ACCOUNT_ACTIVATION
            ),
            used_at__isnull=True,
        )
        .order_by(
            "-created_at"
        )
        .first()
    )

    if activation_token is None:
        return (
            False,
            "NO_ACTIVE_TOKEN",
        )

    now = timezone.now()

    if (
        activation_token.expires_at
        <= now
    ):
        activation_token.used_at = now

        activation_token.save(
            update_fields=[
                "used_at"
            ]
        )

        return (
            False,
            "EXPIRED",
        )

    if not check_password(
        str(raw_token),
        activation_token.code_hash,
    ):
        return (
            False,
            "INVALID_TOKEN",
        )

    if consume:
        activation_token.used_at = now

        activation_token.save(
            update_fields=[
                "used_at"
            ]
        )

    return (
        True,
        "OK",
    )