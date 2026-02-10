

# Register your models here.
from django.contrib import admin
from .models import Prospect, ClientProfile, Quote, QuoteItem, Note


@admin.register(Prospect)
class ProspectAdmin(admin.ModelAdmin):
    list_display = ("id", "first_name", "last_name", "email", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("first_name", "last_name", "email", "phone", "city")


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 1


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "client", "prospect", "created_at")
    list_filter = ("status", "created_at")
    inlines = [QuoteItemInline]


admin.site.register(ClientProfile)
admin.site.register(Note)
