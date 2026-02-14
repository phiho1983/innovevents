from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Event
from .serializers import EventSerializer
from bookings.models import Booking


class EventViewSet(ModelViewSet):
    queryset = Event.objects.all().order_by("-start_at")
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action == "my_events":
            return [IsAuthenticated()]

        return [IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @action(detail=False, methods=["get"], url_path="my")
    def my_events(self, request):
        event_ids = (
            Booking.objects
            .filter(user=request.user)
            .values_list("event_id", flat=True)
            .distinct()
        )
        qs = Event.objects.filter(id__in=event_ids).order_by("-start_at")
        return Response(EventSerializer(qs, many=True).data)
