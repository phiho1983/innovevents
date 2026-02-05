from django.shortcuts import render

# Create your views here.


from rest_framework.viewsets import ModelViewSet
from .models import Event
from .serializers import EventSerializer
class EventViewSet(ModelViewSet):
    queryset = Event.objects.all().order_by("-start_at")
    serializer_class = EventSerializer
