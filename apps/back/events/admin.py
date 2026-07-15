from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Event
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "city", "start_at", "capacity", "organizer")
    search_fields = ("title", "city")
    list_filter = ("city", "start_at")

