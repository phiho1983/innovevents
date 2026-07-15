from rest_framework.routers import DefaultRouter

from events.views import EventViewSet
from bookings.views import BookingViewSet
from crm.views import ProspectViewSet, QuoteViewSet, NoteViewSet
from reviews.views import ReviewViewSet
from accounts.views import UserAdminRightsViewSet

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("bookings", BookingViewSet, basename="booking")

router.register("prospects", ProspectViewSet, basename="prospect")
router.register("quotes", QuoteViewSet, basename="quote")
router.register("notes", NoteViewSet, basename="note")
router.register("reviews", ReviewViewSet, basename="review")
router.register("users-rights", UserAdminRightsViewSet, basename="users-rights")

urlpatterns = router.urls
