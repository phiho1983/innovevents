from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=120)
    start_at = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=1)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")

    def blocked_bookings_count(self):
        # places prises (PENDING + CONFIRMED)
        return sum(
            booking.quantity
            for booking in self.bookings.filter(status__in=["PENDING", "CONFIRMED"])
        )

    def remaining_capacity(self):
        return self.capacity - self.blocked_bookings_count()

    def __str__(self):
        return f"{self.title} - {self.city}"
