from rest_framework.routers import DefaultRouter

from events.views import (
    EventViewSet,
    HomePhotoViewSet,
)

from events.home_hero_views import (
    HomeHeroViewSet,
)

from bookings.views import (
    BookingViewSet,
)

from crm.views import (
    ContactMessageViewSet,
    NoteViewSet,
    ProspectViewSet,
    QuoteViewSet,
)

from reviews.views import (
    ReviewViewSet,
)

from accounts.views import (
    UserAdminRightsViewSet,
)


router = DefaultRouter()


router.register(
    "events",
    EventViewSet,
    basename="event",
)

router.register(
    "home-photos",
    HomePhotoViewSet,
    basename="home-photo",
)

router.register(
    "home-hero",
    HomeHeroViewSet,
    basename="home-hero",
)

router.register(
    "bookings",
    BookingViewSet,
    basename="booking",
)

router.register(
    "prospects",
    ProspectViewSet,
    basename="prospect",
)

router.register(
    "contact-messages",
    ContactMessageViewSet,
    basename="contact-message",
)

router.register(
    "quotes",
    QuoteViewSet,
    basename="quote",
)

router.register(
    "notes",
    NoteViewSet,
    basename="note",
)

router.register(
    "reviews",
    ReviewViewSet,
    basename="review",
)

router.register(
    "users-rights",
    UserAdminRightsViewSet,
    basename="users-rights",
)


urlpatterns = router.urls