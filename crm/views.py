from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Prospect, Quote, Note
from .serializers import ProspectSerializer, QuoteSerializer, NoteSerializer


class ProspectViewSet(viewsets.ModelViewSet):
    queryset = Prospect.objects.all().order_by("-created_at")
    serializer_class = ProspectSerializer
    # Jour 10: POST ouvert (form public). Le "admin only" arrive Jour 11/12.
    permission_classes = [AllowAny]


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by("-created_at")
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
