from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT      = "DRAFT",       "Brouillon"
        ACCEPTED   = "ACCEPTED",    "Accepté"
        IN_PROGRESS= "IN_PROGRESS", "En cours"
        DONE       = "DONE",        "Terminé"
        CANCELLED  = "CANCELLED",   "Annulé"

    class EventType(models.TextChoices):
        SEMINAR    = "SEMINAR",    "Séminaire"
        CONFERENCE = "CONFERENCE", "Conférence"
        PARTY      = "PARTY",      "Soirée d'entreprise"
        OTHER      = "OTHER",      "Autre"

    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    city        = models.CharField(max_length=120)
    start_at    = models.DateTimeField()
    end_at      = models.DateTimeField(null=True, blank=True)
    capacity    = models.PositiveIntegerField(default=1)
    event_type  = models.CharField(max_length=20, choices=EventType.choices,
                                   default=EventType.OTHER)
    theme       = models.CharField(max_length=120, blank=True)
    image       = models.ImageField(upload_to="events/", null=True, blank=True)
    status      = models.CharField(max_length=20, choices=Status.choices,
                                   default=Status.DRAFT)
    visible       = models.BooleanField(default=False)
    client_agreed = models.BooleanField(default=False)
    organizer   = models.ForeignKey(User, on_delete=models.CASCADE,
                                    related_name="organized_events")
    client      = models.ForeignKey(User, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="client_events")
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.title} - {self.city}"

    @property
    def is_public(self):
        return self.client_agreed and self.status != self.Status.DRAFT and self.visible