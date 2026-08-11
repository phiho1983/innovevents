import secrets
from datetime import timedelta

from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

from .models import VerificationCode


CODE_TTL_MINUTES = 10
MAX_ATTEMPTS = 5


def create_verification_code(user, purpose):
    now = timezone.now()

    # Invalide les anciens codes encore actifs pour ce même usage
    VerificationCode.objects.filter(
        user=user,
        purpose=purpose,
        used_at__isnull=True,
    ).update(used_at=now)

    # Génère exactement 6 chiffres, y compris éventuellement 012345
    raw_code = f"{secrets.randbelow(1_000_000):06d}"

    verification_code = VerificationCode.objects.create(
        user=user,
        purpose=purpose,
        code_hash=make_password(raw_code),
        expires_at=now + timedelta(minutes=CODE_TTL_MINUTES),
    )

    return raw_code, verification_code


def check_verification_code(user, purpose, raw_code, consume=True):
    verification_code = (
        VerificationCode.objects
        .filter(
            user=user,
            purpose=purpose,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if verification_code is None:
        return False, "NO_ACTIVE_CODE"

    now = timezone.now()

    if verification_code.expires_at <= now:
        verification_code.used_at = now
        verification_code.save(update_fields=["used_at"])
        return False, "EXPIRED"

    if verification_code.attempts >= MAX_ATTEMPTS:
        verification_code.used_at = now
        verification_code.save(update_fields=["used_at"])
        return False, "TOO_MANY_ATTEMPTS"

    if not check_password(str(raw_code), verification_code.code_hash):
        verification_code.attempts += 1

        update_fields = ["attempts"]

        if verification_code.attempts >= MAX_ATTEMPTS:
            verification_code.used_at = now
            update_fields.append("used_at")

        verification_code.save(update_fields=update_fields)

        return False, "INVALID_CODE"

    if consume:
        verification_code.used_at = now
        verification_code.save(update_fields=["used_at"])

    return True, "OK"