import os
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction

from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from accounts.email_service import (
    send_transactional_email,
)
from accounts.permissions import (
    IsBusinessAdmin,
    IsClient,
)
from accounts.services import (
    create_account_activation_token,
)
from config.mongo import log_action

from .models import (
    ClientProfile,
    Note,
    Prospect,
    Quote,
)
from .serializers import (
    NoteSerializer,
    ProspectAdminSerializer,
    ProspectPublicCreateSerializer,
    ProspectStatusSerializer,
    QuoteSerializer,
)


User = get_user_model()


def build_unique_client_username(email):
    """
    Construit un username à partir de la
    partie locale de l'adresse e-mail.

    On ne conserve que les caractères
    compatibles avec le username Django
    et on garantit son unicité.
    """

    local_part = (
        email
        .split("@", 1)[0]
        .strip()
        .lower()
    )

    base_username = re.sub(
        r"[^\w.@+-]",
        "",
        local_part,
    )

    if not base_username:
        base_username = "client"

    base_username = (
        base_username[:140]
    )

    username = base_username
    counter = 1

    while User.objects.filter(
        username=username
    ).exists():
        suffix = str(counter)

        username = (
            f"{base_username[:150 - len(suffix)]}"
            f"{suffix}"
        )

        counter += 1

    return username


class ProspectViewSet(
    viewsets.ModelViewSet
):
    """
    Gestion des prospects.

    CREATE :
    - public, pour le formulaire
      de demande de devis.

    Autres opérations :
    - ADMIN métier uniquement.

    Les permissions métier reposent
    sur User.role et non sur is_staff.
    """

    queryset = (
        Prospect.objects
        .all()
        .order_by(
            "-created_at"
        )
    )

    def get_permissions(self):
        if self.action == "create":
            return [
                AllowAny()
            ]

        return [
            IsBusinessAdmin()
        ]

    def get_serializer_class(self):
        if self.action == "create":
            return (
                ProspectPublicCreateSerializer
            )

        if self.action == "status":
            return (
                ProspectStatusSerializer
            )

        return (
            ProspectAdminSerializer
        )

    def perform_create(
        self,
        serializer,
    ):
        prospect = serializer.save()

        to_email = getattr(
            settings,
            "QUOTE_CONTACT_EMAIL",
            "contact@innovevents.com",
        )

        subject = (
            "[Innov'Events] "
            "Nouvelle demande de devis — "
            f"{prospect.first_name} "
            f"{prospect.last_name}"
        )

        body = (
            "Nouvelle demande de devis\n\n"
            f"Nom: {prospect.first_name} "
            f"{prospect.last_name}\n"
            f"Email: {prospect.email}\n"
            f"Téléphone: {prospect.phone}\n"
            f"Société: {prospect.company}\n"
            f"Ville: {prospect.city}\n\n"
            f"Message:\n"
            f"{prospect.message}\n\n"
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
            recipient_list=[
                to_email
            ],
            fail_silently=True,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        permission_classes=[
            IsBusinessAdmin
        ],
    )
    def status(
        self,
        request,
        pk=None,
    ):
        prospect = (
            self.get_object()
        )

        serializer = (
            self.get_serializer(
                prospect,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            ProspectAdminSerializer(
                prospect
            ).data,
            status=(
                drf_status
                .HTTP_200_OK
            ),
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="convert",
        permission_classes=[
            IsBusinessAdmin
        ],
    )
    def convert(
        self,
        request,
        pk=None,
    ):
        """
        Convertit un Prospect en Client.

        Le client reçoit un lien
        d'activation temporaire.

        Aucun mot de passe temporaire
        et aucun code de vérification
        ne sont envoyés.

        L'activation finale :
        - prouve l'accès à la boîte mail ;
        - définit le premier mot de passe ;
        - marque l'e-mail comme vérifié ;
        - consomme définitivement le token.
        """

        prospect = (
            self.get_object()
        )

        with transaction.atomic():
            prospect = (
                Prospect.objects
                .select_for_update()
                .get(
                    pk=prospect.pk
                )
            )

            email = (
                prospect.email
                or ""
            ).strip().lower()

            if User.objects.filter(
                email__iexact=email
            ).exists():
                return Response(
                    {
                        "detail": (
                            "Compte existant "
                            "pour cet email."
                        )
                    },
                    status=(
                        drf_status
                        .HTTP_400_BAD_REQUEST
                    ),
                )

            username = (
                build_unique_client_username(
                    email
                )
            )

            user = (
                User.objects.create_user(
                    username=username,
                    email=email,
                    password=None,
                    first_name=(
                        prospect.first_name
                    ),
                    last_name=(
                        prospect.last_name
                    ),
                    role=(
                        User.Role.CLIENT
                    ),
                    is_staff=False,
                    is_superuser=False,
                    email_verified=False,
                    must_change_password=False,
                )
            )

            ClientProfile.objects.create(
                user=user,
                company=prospect.company,
                phone=prospect.phone,
            )

            prospect.status = (
                Prospect.Status.QUALIFIED
            )

            prospect.converted_client = (
                user
            )

            prospect.save(
                update_fields=[
                    "status",
                    "converted_client",
                ]
            )

            (
                Quote.objects
                .filter(
                    prospect=prospect,
                    client__isnull=True,
                )
                .update(
                    client=user
                )
            )

            (
                activation_token,
                _,
            ) = (
                create_account_activation_token(
                    user
                )
            )

        frontend_url = (
            os.getenv(
                "FRONTEND_URL",
                "http://localhost:5173",
            )
            .rstrip("/")
        )

        activation_url = (
            f"{frontend_url}/activation"
            f"?uid={user.id}"
            f"&token={activation_token}"
        )

        activation_email_sent = True

        try:
            send_transactional_email(
                recipient_email=
                    user.email,
                subject=(
                    "Activez votre compte "
                    "Innov'Events"
                ),
                text_content=(
                    f"Bonjour "
                    f"{user.first_name or user.username},\n\n"

                    "Votre compte client Innov'Events "
                    "vient d'être créé.\n\n"

                    f"Votre identifiant est : "
                    f"{user.username}\n\n"

                    "Pour activer votre compte "
                    "et définir votre mot de passe, "
                    "cliquez sur le lien suivant :\n\n"

                    f"{activation_url}\n\n"

                    "Ce lien est personnel, "
                    "valable pendant 24 heures "
                    "et ne peut être utilisé "
                    "qu'une seule fois.\n\n"

                    "Aucun mot de passe temporaire "
                    "ne vous est envoyé.\n\n"

                    "Après activation, vos prochaines "
                    "connexions seront protégées "
                    "par un code de sécurité "
                    "envoyé par e-mail."
                ),
            )

        except Exception:
            activation_email_sent = False

        log_action(
            "CREATION_CLIENT",
            request.user.id,
            {
                "client_id":
                    user.id,
                "nom": (
                    f"{user.first_name} "
                    f"{user.last_name}"
                ).strip(),
                "email":
                    user.email,
                "username":
                    user.username,
                "email_verified":
                    False,
                "activation_required":
                    True,
                "activation_email_sent":
                    activation_email_sent,
            },
        )

        if activation_email_sent:
            detail = (
                "Client créé. "
                "Un lien d'activation "
                "a été envoyé par e-mail."
            )

        else:
            detail = (
                "Client créé, mais "
                "l'e-mail d'activation "
                "n'a pas pu être envoyé."
            )

        return Response(
            {
                "detail":
                    detail,
                "user_id":
                    user.id,
                "username":
                    user.username,
                "email":
                    user.email,
                "email_verified":
                    False,
                "activation_required":
                    True,
                "password_setup_required":
                    True,
                "activation_email_sent":
                    activation_email_sent,
            },
            status=(
                drf_status
                .HTTP_201_CREATED
            ),
        )


class QuoteViewSet(
    viewsets.ModelViewSet
):
    """
    Gestion des devis.

    CLIENT :
    - voit uniquement ses propres devis
    - peut accepter/refuser/demander
      une modification uniquement
      sur ses propres devis.

    EMPLOYEE :
    - peut consulter tous les devis.

    ADMIN :
    - peut consulter et administrer
      tous les devis.

    is_staff n'est jamais utilisé
    comme rôle métier.
    """

    queryset = (
        Quote.objects
        .all()
        .order_by(
            "-created_at"
        )
    )

    serializer_class = (
        QuoteSerializer
    )

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
        ]:
            return [
                IsClient()
            ]

        if self.action in [
            "list",
            "retrieve",
        ]:
            return [
                IsAuthenticated()
            ]

        return [
            IsBusinessAdmin()
        ]

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
        )

        if self.is_internal_user():
            return queryset

        return queryset.filter(
            client=self.request.user
        )

    def get_decidable_quote(self):
        """
        Une décision client n'est autorisée
        que sur un devis au statut SENT.

        Les devis DRAFT ne sont pas encore
        soumis au client.

        Une décision déjà prise ne peut pas
        être remplacée arbitrairement par
        une autre décision.
        """

        quote = self.get_object()

        if quote.status != Quote.Status.SENT:
            raise ValidationError(
                {
                    "detail": (
                        "Seul un devis envoyé "
                        "peut faire l'objet "
                        "d'une décision."
                    )
                }
            )

        return quote

    @action(
        detail=True,
        methods=["post"],
    )
    def accept(
        self,
        request,
        pk=None,
    ):
        quote = (
            self.get_decidable_quote()
        )

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
                "a été accepté "
                "par le client."
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
    def refuse(
        self,
        request,
        pk=None,
    ):
        quote = (
            self.get_decidable_quote()
        )

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
        quote = (
            self.get_decidable_quote()
        )

        reason = (
            request.data.get(
                "reason",
                "",
            )
        )

        quote.status = (
            Quote.Status
            .CHANGE_REQUESTED
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
                f"[Modif devis "
                f"#{quote.id}] "
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

        from django.http import (
            HttpResponse,
        )
        from reportlab.lib.pagesizes import (
            A4,
        )
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

        y = (
            height
            - 82 * mm
        )

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


class NoteViewSet(
    viewsets.ModelViewSet
):
    """
    Notes internes.

    Accès ADMIN métier uniquement
    pour le moment.

    La collaboration EMPLOYEE
    sera traitée dans la phase dédiée.
    """

    queryset = (
        Note.objects
        .all()
        .order_by(
            "-created_at"
        )
    )

    serializer_class = (
        NoteSerializer
    )

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