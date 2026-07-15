from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crée l'admin par défaut (Chloé) si absent"

    def handle(self, *args, **options):
        User = get_user_model()

        username = "chloe"
        email = "chloe@innovevents.com"
        password = "Chloe123!"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin créé: {username} / {password}"))
            return

        updated = False
        if not user.is_staff:
            user.is_staff = True
            updated = True
        if not user.is_superuser:
            user.is_superuser = True
            updated = True
        if updated:
            user.save()

        self.stdout.write(self.style.WARNING(f"Admin déjà existant: {username}"))
