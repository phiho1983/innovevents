import os
import sys
from pathlib import Path


# Ajoute la racine du projet Django au PYTHONPATH
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))


# Charge la configuration Django
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()


from django.contrib.auth import get_user_model


User = get_user_model()


username = os.getenv(
    "DJANGO_SUPERUSER_USERNAME",
    "admin",
).strip()

email = os.getenv(
    "DJANGO_SUPERUSER_EMAIL",
    "admin@innovevents.local",
).strip()

password = os.getenv(
    "DJANGO_SUPERUSER_PASSWORD",
    "",
)


user = User.objects.filter(
    username=username
).first()


if user is None:
    if not password:
        raise RuntimeError(
            "DJANGO_SUPERUSER_PASSWORD doit être défini "
            "pour créer le compte administrateur initial."
        )

    user = User.objects.create(
        username=username,
        email=email,
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
        is_active=True,
        email_verified=True,
    )

    user.set_password(password)
    user.save()

    print(
        f"✅ Superuser créé : {username}"
    )

else:
    fields_to_update = []

    if user.role != User.Role.ADMIN:
        user.role = User.Role.ADMIN
        fields_to_update.append("role")

    if not user.is_staff:
        user.is_staff = True
        fields_to_update.append("is_staff")

    if not user.is_superuser:
        user.is_superuser = True
        fields_to_update.append("is_superuser")

    if not user.is_active:
        user.is_active = True
        fields_to_update.append("is_active")

    if not user.email_verified:
        user.email_verified = True
        fields_to_update.append("email_verified")

    if email and user.email != email:
        user.email = email
        fields_to_update.append("email")

    if fields_to_update:
        user.save(
            update_fields=fields_to_update
        )

    print(
        f"ℹ️ Superuser déjà présent : {username}"
    )