from rest_framework import viewsets,filters
from rest_framework.permissions import AllowAny,IsAuthenticated,IsAdminUser
from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class=EventSerializer

    def get_queryset(self):
        qs=Event.objects.all().order_by("start_at")
        if self.request.query_params.get("public"):
            qs=qs.filter(visible=True,client_agreed=True).exclude(status="DRAFT")
        t=self.request.query_params.get("event_type")
        if t: qs=qs.filter(event_type=t)
        th=self.request.query_params.get("theme")
        if th: qs=qs.filter(theme__icontains=th)
        sa=self.request.query_params.get("start_after")
        if sa: qs=qs.filter(start_at__date__gte=sa)
        sb=self.request.query_params.get("start_before")
        if sb: qs=qs.filter(start_at__date__lte=sb)
        upcoming=self.request.query_params.get("upcoming")
        if upcoming: qs=qs.order_by("start_at")[:int(upcoming)]
        return qs

    def get_permissions(self):
        if self.action in ["list","retrieve"]: return [AllowAny()]
        return [IsAdminUser()]