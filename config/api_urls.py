from rest_framework.routers import DefaultRouter
from events.views import EventViewSet
from bookings.views import BookingViewSet
router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("bookings", BookingViewSet, basename="booking")
urlpatterns = router.urls