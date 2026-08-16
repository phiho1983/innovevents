from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from .email_service import send_transactional_email

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from config.mongo import log_action

from .models import VerificationCode
from .serializers import (
    UserRightsSerializer,
    VerifiedTokenObtainPairSerializer,
)
from .services import create_verification_code, check_verification_code


User = get_user_model()


class IsDashboardAdmin(BasePermission):
    """
    Autorise uniquement les comptes qui ont accès au dashboard admin.
    """

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or getattr(user, "role", None) == User.Role.ADMIN
            )
        )


class LoggedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        ip = (
            request.META.get("HTTP_X_FORWARDED_FOR", "")
            .split(",")[0]
            .strip()
            or request.META.get("REMOTE_ADDR", "inconnue")
        )

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            username = request.data.get("username", "")
            user = User.objects.filter(username=username).first()

            log_action(
                "CONNEXION_REUSSIE",
                user.id if user else None,
                {
                    "username": username,
                    "ip": ip,
                },
            )

        else:
            log_action(
                "CONNEXION_ECHOUEE",
                None,
                {
                    "username_tente": request.data.get("username", ""),
                    "ip": ip,
                },
            )

        return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user

    return Response(
        {
            "id": u.id,
            "username": u.get_username(),
            "email": getattr(u, "email", ""),
            "role": getattr(u, "role", ""),
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = (request.data.get("username") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not username:
        return Response(
            {"username": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        return Response(
            {"email": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"username": ["Déjà utilisé."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"email": ["Email déjà utilisé."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(password)

    except ValidationError as exc:
        return Response(
            {"password": list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=User.Role.CLIENT,
            is_staff=False,
            email_verified=False,
        )

        code, _ = create_verification_code(
            user,
            VerificationCode.Purpose.EMAIL_VERIFICATION,
        )

    send_transactional_email(
    recipient_email=user.email,
    subject="Votre code de vérification Innov'Events",
    text_content=(
        f"Bonjour {user.username},\n\n"
        f"Votre code de vérification est : {code}\n\n"
        "Ce code est valable pendant 10 minutes.\n\n"
        "Si vous n'êtes pas à l'origine de cette inscription, "
        "vous pouvez ignorer ce message."
    ),
)

    return Response(
        {
            "detail": (
                "Compte créé. Un code de vérification "
                "a été envoyé par e-mail."
            ),
            "email": user.email,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    email = (request.data.get("email") or "").strip().lower()
    code = (request.data.get("code") or "").strip()

    if not email:
        return Response(
            {"email": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not code:
        return Response(
            {"code": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email
    ).first()

    if not user:
        return Response(
            {"detail": "Code invalide ou expiré."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.email_verified:
        return Response(
            {"detail": "Adresse e-mail déjà vérifiée."},
            status=status.HTTP_200_OK,
        )

    valid, reason = check_verification_code(
        user,
        VerificationCode.Purpose.EMAIL_VERIFICATION,
        code,
    )

    if not valid:
        return Response(
            {"detail": "Code invalide ou expiré."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.email_verified = True
    user.save(
        update_fields=["email_verified"]
    )

    return Response(
        {
            "detail": (
                "Adresse e-mail vérifiée avec succès."
            )
        },
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def resend_code(request):
    email = (
        request.data.get("email") or ""
    ).strip().lower()

    purpose = (
        request.data.get("purpose") or ""
    ).strip()

    if not email:
        return Response(
            {"email": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_purposes = [
        VerificationCode.Purpose.EMAIL_VERIFICATION,
        VerificationCode.Purpose.PASSWORD_RESET,
    ]

    if purpose not in allowed_purposes:
        return Response(
            {"purpose": ["Type de code invalide."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email
    ).first()

    generic_response = {
        "detail": (
            "Si cet email existe, "
            "un nouveau code a été envoyé."
        )
    }

    if not user:
        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )

    if (
        purpose
        == VerificationCode.Purpose.EMAIL_VERIFICATION
        and user.email_verified
    ):
        return Response(
            {
                "detail": (
                    "Adresse e-mail déjà vérifiée."
                )
            },
            status=status.HTTP_200_OK,
        )

    code, _ = create_verification_code(
        user,
        purpose,
    )

    if purpose == VerificationCode.Purpose.EMAIL_VERIFICATION:
        subject = "Nouveau code de vérification Innov'Events"

        message = (
            f"Bonjour {user.username},\n\n"
            f"Votre nouveau code de vérification est : {code}\n\n"
            "Ce code est valable pendant 10 minutes.\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, "
            "vous pouvez ignorer ce message."
        )

    else:
        subject = "Nouveau code de réinitialisation Innov'Events"

        message = (
            f"Bonjour {user.username},\n\n"
            f"Votre nouveau code de réinitialisation est : {code}\n\n"
            "Ce code est valable pendant 10 minutes.\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, "
            "vous pouvez ignorer ce message."
        )

    send_transactional_email(
    recipient_email=user.email,
    subject=subject,
    text_content=message,
)

    return Response(
        generic_response,
        status=status.HTTP_200_OK,
    )



@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email = (
        request.data.get("email") or ""
    ).strip().lower()

    generic_response = {
        "detail": (
            "Si cet email existe, "
            "un code de réinitialisation a été envoyé."
        )
    }

    if not email:
        return Response(
            {"email": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email
    ).first()

    if not user:
        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )

    code, _ = create_verification_code(
        user,
        VerificationCode.Purpose.PASSWORD_RESET,
    )

    send_transactional_email(
    recipient_email=user.email,
    subject="Réinitialisation de votre mot de passe Innov'Events",
    text_content=(
        f"Bonjour {user.username},\n\n"
        f"Votre code de réinitialisation est : {code}\n\n"
        "Ce code est valable pendant 10 minutes.\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, "
        "vous pouvez ignorer ce message."
    ),
)

    return Response(
        generic_response,
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    email = (
        request.data.get("email") or ""
    ).strip().lower()

    code = (
        request.data.get("code") or ""
    ).strip()

    new_password = (
        request.data.get("password") or ""
    )

    if not email:
        return Response(
            {"email": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not code:
        return Response(
            {"code": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not new_password:
        return Response(
            {"password": ["Obligatoire."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email
    ).first()

    if not user:
        return Response(
            {"detail": "Code invalide ou expiré."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(
            new_password,
            user=user,
        )

    except ValidationError as exc:
        return Response(
            {"password": list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid, reason = check_verification_code(
        user,
        VerificationCode.Purpose.PASSWORD_RESET,
        code,
    )

    if not valid:
        return Response(
            {"detail": "Code invalide ou expiré."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.must_change_password = False

    user.save(
        update_fields=[
            "password",
            "must_change_password",
        ]
    )

    log_action(
        "MOT_DE_PASSE_REINITIALISE",
        user.id,
        {
            "username": user.username,
        },
    )

    return Response(
        {
            "detail": (
                "Mot de passe réinitialisé avec succès."
            )
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    new_pwd = request.data.get(
        "password",
        "",
    )

    if len(new_pwd) < 8:
        return Response(
            {
                "password": [
                    "8 caractères minimum."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(new_pwd)
    request.user.must_change_password = False
    request.user.save()

    return Response(
        {
            "detail": (
                "Mot de passe mis à jour."
            )
        }
    )


class UserAdminRightsViewSet(
    viewsets.ReadOnlyModelViewSet
):
    """
    Liste les utilisateurs et permet de donner
    ou retirer les droits admin.

    Accès réservé à l'admin connecté.
    """

    serializer_class = UserRightsSerializer
    permission_classes = [IsDashboardAdmin]

    def get_queryset(self):
        return User.objects.all().order_by(
            "username"
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="promote-admin",
    )
    def promote_admin(
        self,
        request,
        pk=None,
    ):
        target_user = self.get_object()

        if target_user.is_superuser:
            return Response(
                {
                    "detail": (
                        "Un super admin Django "
                        "doit être géré côté technique."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.role = User.Role.ADMIN
        target_user.is_staff = True

        target_user.save(
            update_fields=[
                "role",
                "is_staff",
            ]
        )

        log_action(
            "DROITS_ADMIN_AJOUTES",
            request.user.id,
            {
                "target_user_id": target_user.id,
                "target_username": target_user.username,
            },
        )

        serializer = self.get_serializer(
            target_user
        )

        return Response(
            serializer.data
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="remove-admin",
    )
    def remove_admin(
        self,
        request,
        pk=None,
    ):
        target_user = self.get_object()

        if target_user.id == request.user.id:
            return Response(
                {
                    "detail": (
                        "Vous ne pouvez pas retirer "
                        "vos propres droits admin "
                        "depuis le dashboard."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_user.is_superuser:
            return Response(
                {
                    "detail": (
                        "Un super admin Django "
                        "doit être géré côté technique."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_user.role == User.Role.ADMIN:
            target_user.role = User.Role.CLIENT

        target_user.is_staff = False

        target_user.save(
            update_fields=[
                "role",
                "is_staff",
            ]
        )

        log_action(
            "DROITS_ADMIN_RETIRES",
            request.user.id,
            {
                "target_user_id": target_user.id,
                "target_username": target_user.username,
            },
        )

        serializer = self.get_serializer(
            target_user
        )

        return Response(
            serializer.data
        )