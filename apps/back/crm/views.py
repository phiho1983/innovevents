from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.crypto import get_random_string

from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsBusinessAdmin
from config.mongo import log_action

from .models import ClientProfile, Note, Prospect, Quote
from .serializers import (
    NoteSerializer,
    ProspectAdminSerializer,
    ProspectPublicCreateSerializer,
    ProspectStatusSerializer,
    QuoteSerializer,
)


User = get_user_model()


class ProspectViewSet(viewsets.ModelViewSet):
    """
    Gestion des prospects.

    CREATE :
    - public, pour le formulaire de demande de devis.

    Autres opérations :
    - ADMIN métier uniquement.

    Les permissions métier reposent sur User.role
    et non sur is_staff.
    """

    queryset = Prospect.objects.all().order_by("-created_at")

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]

        return [IsBusinessAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return ProspectPublicCreateSerializer

        if self.action == "status":
            return ProspectStatusSerializer

        return ProspectAdminSerializer

    def perform_create(self, serializer):
        prospect = serializer.save()

        to_email = getattr(
            settings,
            "QUOTE_CONTACT_EMAIL",
            "contact@innovevents.com",
        )

        subject = (
            "[Innov'Events] Nouvelle demande de devis — "
            f"{prospect.first_name} {prospect.last_name}"
        )

        body = (
            "Nouvelle demande de devis\n\n"
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
            from_email=getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                None,
            ),
            recipient_list=[to_email],
            fail_silently=True,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        permission_classes=[IsBusinessAdmin],
    )
    def status(self, request, pk=None):
        """
        PATCH /api/prospects/{id}/status/

        Body:
        {
            "status": "CONTACTED"
        }
        """

        prospect = self.get_object()

        serializer = self.get_serializer(
            prospect,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            ProspectAdminSerializer(
                prospect
            ).data,
            status=drf_status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="convert",
        permission_classes=[IsBusinessAdmin],
    )
    def convert(self, request, pk=None):
        prospect = self.get_object()

        if User.objects.filter(
            email__iexact=prospect.email
        ).exists():
            return Response(
                {
                    "detail":
                        "Compte existant pour cet email."
                },
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        temporary_password = get_random_string(12)

        base_username = prospect.email.split("@")[0]
        username = base_username
        counter = 1

        while User.objects.filter(
            username=username
        ).exists():
            username = (
                f"{base_username}{counter}"
            )
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=prospect.email,
            password=temporary_password,

            # Sécurité :
            # une conversion Prospect -> Client
            # crée obligatoirement un CLIENT.
            role=User.Role.CLIENT,
            is_staff=False,
        )

        user.first_name = prospect.first_name
        user.last_name = prospect.last_name

        user.save(
            update_fields=[
                "first_name",
                "last_name",
            ]
        )

        ClientProfile.objects.create(
            user=user,
            company=prospect.company,
            phone=prospect.phone,
        )

        prospect.status = (
            Prospect.Status.QUALIFIED
        )

        prospect.save(
            update_fields=[
                "status",
            ]
        )

        log_action(
            "CREATION_CLIENT",
            request.user.id,
            {
                "client_id": user.id,
                "nom": (
                    f"{user.first_name} "
                    f"{user.last_name}"
                ),
                "email": user.email,
            },
        )

        send_mail(
            "Votre compte Innov'Events",
            (
                f"Bonjour {user.first_name},\n\n"
                f"Login: {user.email}\n"
                f"Mot de passe: {temporary_password}\n\n"
                "Modifiez-le à la première connexion."
            ),
            None,
            [user.email],
            fail_silently=True,
        )

        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=drf_status.HTTP_201_CREATED,
        )


class QuoteViewSet(viewsets.ModelViewSet):
    """
    Gestion des devis.

    CLIENT :
    - voit uniquement ses propres devis
    - peut accepter/refuser/demander une modification
      uniquement sur ses propres devis.

    EMPLOYEE :
    - peut consulter tous les devis.

    ADMIN :
    - peut consulter et administrer tous les devis.

    is_staff n'est jamais utilisé comme rôle métier.
    """

    queryset = Quote.objects.all().order_by(
        "-created_at"
    )

    serializer_class = QuoteSerializer

    def is_internal_user(self):
        user = self.request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role in (
                    User.Role.ADMIN,
                    User.Role.EMPLOYEE,
                )
            )
        )

    def get_permissions(self):
        if self.action in [
            "accept",
            "refuse",
            "request_change",
            "list",
            "retrieve",
        ]:
            return [IsAuthenticated()]

        # CREATE / UPDATE / PATCH / DELETE / PDF
        # gardent le comportement actuel :
        # ADMIN métier uniquement.
        return [IsBusinessAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # ADMIN / EMPLOYEE :
        # accès à tous les devis.
        if self.is_internal_user():
            return queryset

        # CLIENT :
        # uniquement les devis qui lui appartiennent.
        return queryset.filter(
            client=self.request.user
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def accept(self, request, pk=None):
        quote = self.get_object()

        quote.status = (
            Quote.Status.ACCEPTED
        )

        quote.save(
            update_fields=[
                "status",
            ]
        )

        send_mail(
            "Devis accepté",
            (
                f"Le devis #{quote.id} "
                "a été accepté par le client."
            ),
            None,
            [
                "contact@innovevents.com"
            ],
            fail_silently=True,
        )

        return Response(
            {
                "status":
                    quote.status
            }
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def refuse(self, request, pk=None):
        quote = self.get_object()

        quote.status = (
            Quote.Status.REFUSED
        )

        quote.save(
            update_fields=[
                "status",
            ]
        )

        return Response(
            {
                "status":
                    quote.status
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="request-change",
    )
    def request_change(
        self,
        request,
        pk=None,
    ):
        quote = self.get_object()

        reason = request.data.get(
            "reason",
            "",
        )

        quote.status = (
            Quote.Status.CHANGE_REQUESTED
        )

        quote.save(
            update_fields=[
                "status",
            ]
        )

        Note.objects.create(
            author=request.user,
            client=quote.client,
            content=(
                f"[Modif devis #{quote.id}] "
                f"{reason}"
            ),
        )

        return Response(
            {
                "status":
                    quote.status
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="pdf",
    )
    def generate_pdf(
        self,
        request,
        pk=None,
    ):
        import io

        from django.http import HttpResponse

        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas

        quote = self.get_object()

        buffer = io.BytesIO()

        pdf = canvas.Canvas(
            buffer,
            pagesize=A4,
        )

        width, height = A4

        pdf.setFont(
            "Helvetica-Bold",
            20,
        )

        pdf.drawString(
            20 * mm,
            height - 25 * mm,
            "Innov'Events",
        )

        pdf.setFont(
            "Helvetica",
            11,
        )

        pdf.drawString(
            20 * mm,
            height - 35 * mm,
            (
                f"Devis N° {quote.id}   |   "
                "Date : "
                f"{quote.created_at.strftime('%d/%m/%Y')}"
            ),
        )

        if quote.client:
            pdf.drawString(
                20 * mm,
                height - 50 * mm,
                (
                    "Client : "
                    f"{quote.client.first_name} "
                    f"{quote.client.last_name} — "
                    f"{quote.client.email}"
                ),
            )

        pdf.setFont(
            "Helvetica-Bold",
            12,
        )

        pdf.drawString(
            20 * mm,
            height - 70 * mm,
            "Prestations",
        )

        pdf.setFont(
            "Helvetica",
            11,
        )

        y = height - 82 * mm

        for item in quote.items.all():
            pdf.drawString(
                25 * mm,
                y,
                f"• {item.label}",
            )

            pdf.drawRightString(
                185 * mm,
                y,
                f"{item.amount_ht} EUR HT",
            )

            y -= 8 * mm

        y -= 4 * mm

        pdf.line(
            20 * mm,
            y,
            185 * mm,
            y,
        )

        y -= 8 * mm

        pdf.drawString(
            130 * mm,
            y,
            "Total HT :",
        )

        pdf.drawRightString(
            185 * mm,
            y,
            f"{quote.total_ht} EUR",
        )

        y -= 8 * mm

        pdf.drawString(
            130 * mm,
            y,
            (
                "TVA "
                f"({int(quote.tva_rate * 100)}%) :"
            ),
        )

        pdf.drawRightString(
            185 * mm,
            y,
            f"{quote.total_tva} EUR",
        )

        y -= 8 * mm

        pdf.setFont(
            "Helvetica-Bold",
            12,
        )

        pdf.drawString(
            130 * mm,
            y,
            "Total TTC :",
        )

        pdf.drawRightString(
            185 * mm,
            y,
            f"{quote.total_ttc} EUR",
        )

        pdf.save()

        buffer.seek(0)

        log_action(
            "GENERATION_PDF_DEVIS",
            request.user.id,
            {
                "quote_id":
                    quote.id
            },
        )

        response = HttpResponse(
            buffer,
            content_type=(
                "application/pdf"
            ),
        )

        response[
            "Content-Disposition"
        ] = (
            'attachment; '
            f'filename="devis_{quote.id}.pdf"'
        )

        return response


class NoteViewSet(viewsets.ModelViewSet):
    """
    Notes internes.

    Accès ADMIN métier uniquement pour le moment.

    La collaboration EMPLOYEE sera traitée
    dans la phase dédiée.
    """

    queryset = Note.objects.all().order_by(
        "-created_at"
    )

    serializer_class = NoteSerializer

    permission_classes = [
        IsBusinessAdmin
    ]

    def perform_create(
        self,
        serializer,
    ):
        serializer.save(
            author=self.request.user
        )