from decimal import Decimal

from django.conf import settings
from django.db import models


class Prospect(models.Model):
    class Status(models.TextChoices):
        TO_CONTACT = "TO_CONTACT", "À contacter"
        CONTACTED = "CONTACTED", "Contacté"
        QUALIFIED = "QUALIFIED", "Qualifié"
        ARCHIVED = "ARCHIVED", "Archivé"

    first_name = models.CharField(
        max_length=80,
    )

    last_name = models.CharField(
        max_length=80,
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    company = models.CharField(
        max_length=120,
        blank=True,
    )

    city = models.CharField(
        max_length=120,
        blank=True,
    )

    message = models.TextField(
        max_length=5000,
    )

    event_type = models.CharField(
        max_length=50,
        blank=True,
    )

    desired_date = models.DateField(
        null=True,
        blank=True,
    )

    participant_count = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    converted_client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_prospects",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TO_CONTACT,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        return (
            f"{self.first_name} "
            f"{self.last_name} "
            f"({self.email})"
        )


class ContactMessage(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "Nouveau"
        READ = "READ", "Lu"
        REPLIED = "REPLIED", "Répondu"
        ARCHIVED = "ARCHIVED", "Archivé"

    name = models.CharField(
        max_length=120,
    )

    email = models.EmailField()

    subject = models.CharField(
        max_length=160,
    )

    message = models.TextField(
        max_length=5000,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_contact_messages",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

    def __str__(self) -> str:
        return (
            f"Message#{self.id} "
            f"{self.subject}"
        )


class ClientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_profile",
    )

    company = models.CharField(
        max_length=120,
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
    )

    address = models.CharField(
        max_length=255,
        blank=True,
    )

    def __str__(self) -> str:
        return (
            f"ClientProfile("
            f"{self.user_id})"
        )


class Quote(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SENT = "SENT", "Envoyé"
        ACCEPTED = "ACCEPTED", "Accepté"
        REFUSED = "REFUSED", "Refusé"
        CHANGE_REQUESTED = (
            "CHANGE_REQUESTED",
            "Modification demandée",
        )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    prospect = models.ForeignKey(
        Prospect,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    tva_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.20"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        return (
            f"Quote#{self.id} "
            f"{self.status}"
        )

    @property
    def total_ht(self) -> Decimal:
        return sum(
            (
                item.amount_ht
                for item
                in self.items.all()
            ),
            Decimal("0.00"),
        )

    @property
    def total_tva(self) -> Decimal:
        return (
            self.total_ht
            * self.tva_rate
        ).quantize(
            Decimal("0.01")
        )

    @property
    def total_ttc(self) -> Decimal:
        return (
            self.total_ht
            + self.total_tva
        ).quantize(
            Decimal("0.01")
        )


class QuoteItem(models.Model):
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="items",
    )

    label = models.CharField(
        max_length=200,
    )

    amount_ht = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    def __str__(self) -> str:
        return (
            f"{self.label} "
            f"({self.amount_ht} HT)"
        )


class Note(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes_authored",
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes_about",
    )

    content = models.TextField()

    pinned = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        return f"Note#{self.id}"