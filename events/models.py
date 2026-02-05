from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()
class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=120)
    start_at = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=0)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")
def __str__(self):
        return f"{self.title} - {self.city}"


