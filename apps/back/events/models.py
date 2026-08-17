from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Sum


User = get_user_model()


class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        ACCEPTED = "ACCEPTED", "Accepté"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        DONE = "DONE", "Terminé"
        CANCELLED = "CANCELLED", "Annulé"

    class EventType(models.TextChoices):
        SEMINAR = "SEMINAR", "Séminaire"
        CONFERENCE = "CONFERENCE", "Conférence"
        PARTY = "PARTY", "Soirée d'entreprise"
        OTHER = "OTHER", "Autre"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=120)
    start_at = models.DateTimeField()

    end_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    capacity = models.PositiveIntegerField(default=1)

    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.OTHER,
    )

    theme = models.CharField(
        max_length=120,
        blank=True,
    )

    image = models.ImageField(
        upload_to="events/",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    visible = models.BooleanField(default=False)
    client_agreed = models.BooleanField(default=False)

    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )

    client = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="client_events",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.city}"

    def remaining_capacity(self):
        reserved = (
            self.bookings
            .filter(
                status__in=[
                    "PENDING",
                    "CONFIRMED",
                ]
            )
            .aggregate(total=Sum("quantity"))
            .get("total")
            or 0
        )

        return max(self.capacity - reserved, 0)

    @property
    def is_public(self):
        return (
            self.client_agreed
            and self.status != self.Status.DRAFT
            and self.visible
        )


class HomePhoto(models.Model):
    """
    Photo d'exemple affichée dans le carrousel
    de la page d'accueil.

    Les 12 slots correspondent aux 12 emplacements
    actuels du carrousel.
    """

    slot = models.PositiveSmallIntegerField(
        unique=True,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(12),
        ],
    )

    image_url = models.URLField(
        max_length=500,
        blank=True,
    )

    cloudinary_public_id = models.CharField(
        max_length=255,
        blank=True,
    )

    alt_text = models.CharField(
        max_length=200,
        blank=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["slot"]

    def __str__(self):
        return f"Photo accueil - emplacement {self.slot}"