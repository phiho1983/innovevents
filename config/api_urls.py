from rest_framework.routers import DefaultRouter

from events.views import EventViewSet
from bookings.views import BookingViewSet
from crm.views import ProspectViewSet, QuoteViewSet, NoteViewSet

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("bookings", BookingViewSet, basename="booking")

router.register("prospects", ProspectViewSet, basename="prospect")
router.register("quotes", QuoteViewSet, basename="quote")
router.register("notes", NoteViewSet, basename="note")

urlpatterns = router.urls
