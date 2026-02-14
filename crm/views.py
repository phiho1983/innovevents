from django.conf import settings
from django.core.mail import send_mail

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Prospect, Quote, Note
from .serializers import (
    ProspectPublicCreateSerializer,
    ProspectAdminSerializer,
    ProspectStatusSerializer,
    QuoteSerializer,
    NoteSerializer,
)


class ProspectViewSet(viewsets.ModelViewSet):
    queryset = Prospect.objects.all().order_by("-created_at")

    def get_permissions(self):
        # POST public (form)
        if self.action == "create":
            return [AllowAny()]

        # le reste : admin only (GET list/retrieve, patch status, etc.)
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == "create":
            return ProspectPublicCreateSerializer
        if self.action == "status":
            return ProspectStatusSerializer
        return ProspectAdminSerializer

    def perform_create(self, serializer):
        prospect = serializer.save()

        # Email (mock console si EMAIL_BACKEND = console)
        to_email = getattr(settings, "QUOTE_CONTACT_EMAIL", "contact@innovevents.com")
        subject = f"[Innov'Events] Nouvelle demande de devis — {prospect.first_name} {prospect.last_name}"

        body = (
            f"Nouvelle demande de devis\n\n"
            f"Nom: {prospect.first_name} {prospect.last_name}\n"
            f"Email: {prospect.email}\n"
            f"Téléphone: {prospect.phone}\n"
            f"Société: {prospect.company}\n"
            f"Ville: {prospect.city}\n\n"
            f"Message:\n{prospect.message}\n\n"
            f"Statut: {prospect.status}\n"
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[to_email],
            fail_silently=True,  # MVP: ne bloque pas si mail non configuré
        )

    @action(detail=True, methods=["patch"], url_path="status", permission_classes=[IsAdminUser])
    def status(self, request, pk=None):
        """
        PATCH /api/prospects/{id}/status/
        Body: { "status": "CONTACTED" }
        """
        prospect = self.get_object()
        serializer = self.get_serializer(prospect, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # on renvoie l'objet complet (admin serializer) pour voir le résultat
        return Response(ProspectAdminSerializer(prospect).data, status=drf_status.HTTP_200_OK)


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
