from django.contrib import admin

# Register your models here.


from django.contrib import admin
from .models import Booking
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "quantity", "status", "created_at")
    list_filter = ("status", "created_at")