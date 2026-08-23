from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur"
        EMPLOYEE = "EMPLOYEE", "Employé"
        CLIENT = "CLIENT", "Client"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )

    must_change_password = models.BooleanField(
        default=False
    )

    email_verified = models.BooleanField(
        default=False
    )


class VerificationCode(models.Model):
    class Purpose(models.TextChoices):
        EMAIL_VERIFICATION = (
            "EMAIL_VERIFICATION",
            "Vérification e-mail",
        )

        PASSWORD_RESET = (
            "PASSWORD_RESET",
            "Réinitialisation du mot de passe",
        )

        LOGIN_2FA = (
            "LOGIN_2FA",
            "Authentification à deux facteurs",
        )

        ACCOUNT_ACTIVATION = (
            "ACCOUNT_ACTIVATION",
            "Activation du compte",
        )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="verification_codes",
    )

    purpose = models.CharField(
        max_length=30,
        choices=Purpose.choices,
    )

    code_hash = models.CharField(
        max_length=128
    )

    expires_at = models.DateTimeField()

    attempts = models.PositiveSmallIntegerField(
        default=0
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.user.username} "
            f"- {self.purpose}"
        )