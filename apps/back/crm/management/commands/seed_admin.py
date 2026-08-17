import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Crée ou sécurise le compte administrateur "
        "initial Innov'Events."
    )

    def handle(self, *args, **options):
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

            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                role=User.Role.ADMIN,
                email_verified=True,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Superuser créé : {username}"
                )
            )

            return

        fields_to_update = []

        if user.role != User.Role.ADMIN:
            user.role = User.Role.ADMIN
            fields_to_update.append(
                "role"
            )

        if not user.is_staff:
            user.is_staff = True
            fields_to_update.append(
                "is_staff"
            )

        if not user.is_superuser:
            user.is_superuser = True
            fields_to_update.append(
                "is_superuser"
            )

        if not user.is_active:
            user.is_active = True
            fields_to_update.append(
                "is_active"
            )

        if not user.email_verified:
            user.email_verified = True
            fields_to_update.append(
                "email_verified"
            )

        if (
            email
            and user.email != email
        ):
            user.email = email
            fields_to_update.append(
                "email"
            )

        if fields_to_update:
            user.save(
                update_fields=fields_to_update
            )

        self.stdout.write(
            self.style.WARNING(
                f"Superuser déjà existant : {username}"
            )
        )