from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from config.mongo import log_action

from .email_service import send_transactional_email
from .models import VerificationCode
from .permissions import IsBusinessAdmin
from .serializers import UserRightsSerializer
from .services import (
    check_verification_code,
    create_verification_code,
)
from .throttles import (
    ForgotPasswordRateThrottle,
    Login2FARateThrottle,
    LoginRateThrottle,
    ResendCodeRateThrottle,
    ResetPasswordRateThrottle,
    SignupRateThrottle,
    VerifyEmailRateThrottle,
)


User = get_user_model()


def get_client_ip(request):
    forwarded_for = request.META.get(
        "HTTP_X_FORWARDED_FOR",
        "",
    )

    if forwarded_for:
        return (
            forwarded_for
            .split(",")[0]
            .strip()
        )

    return request.META.get(
        "REMOTE_ADDR",
        "inconnue",
    )


class LoggedTokenObtainPairView(APIView):
    """
    Première étape de connexion.

    1. Vérifie username + mot de passe.
    2. Vérifie que l'adresse e-mail est validée.
    3. Génère un code LOGIN_2FA.
    4. Envoie ce code par e-mail.

    Aucun JWT n'est délivré à cette étape.
    """

    permission_classes = [
        AllowAny
    ]

    throttle_classes = [
        LoginRateThrottle
    ]

    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        username = (
            request.data.get("username")
            or ""
        ).strip()

        password = (
            request.data.get("password")
            or ""
        )

        ip = get_client_ip(request)

        if not username:
            return Response(
                {
                    "username": [
                        "Obligatoire."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password:
            return Response(
                {
                    "password": [
                        "Obligatoire."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request=request,
            username=username,
            password=password,
        )

        if user is None:
            log_action(
                "CONNEXION_ECHOUEE",
                None,
                {
                    "username_tente":
                        username,
                    "ip":
                        ip,
                    "reason":
                        "INVALID_CREDENTIALS",
                },
            )

            return Response(
                {
                    "detail":
                        "Identifiants invalides."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.email_verified:
            log_action(
                "CONNEXION_ECHOUEE",
                user.id,
                {
                    "username_tente":
                        username,
                    "ip":
                        ip,
                    "reason":
                        "EMAIL_NOT_VERIFIED",
                },
            )

            return Response(
                {
                    "detail":
                        "Adresse e-mail non vérifiée."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        code, _ = create_verification_code(
            user,
            VerificationCode.Purpose.LOGIN_2FA,
        )

        send_transactional_email(
            recipient_email=user.email,
            subject=(
                "Votre code de connexion "
                "Innov'Events"
            ),
            text_content=(
                f"Bonjour {user.username},\n\n"
                "Une connexion à votre compte "
                "Innov'Events vient d'être demandée.\n\n"
                f"Votre code de connexion est : {code}\n\n"
                "Ce code est valable pendant 10 minutes.\n\n"
                "Saisissez ce code directement "
                "dans l'application Innov'Events.\n\n"
                "Si vous n'êtes pas à l'origine de cette "
                "connexion, ne communiquez ce code "
                "à personne."
            ),
        )

        log_action(
            "CODE_2FA_ENVOYE",
            user.id,
            {
                "username":
                    user.username,
                "ip":
                    ip,
            },
        )

        return Response(
            {
                "detail": (
                    "Identifiants valides. "
                    "Un code de connexion a été "
                    "envoyé par e-mail."
                ),
                "requires_2fa": True,
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([Login2FARateThrottle])
def login_2fa(request):
    """
    Deuxième étape de connexion.

    Body :
    {
        "username": "...",
        "code": "123456"
    }

    Les JWT access + refresh ne sont délivrés
    qu'après validation du code LOGIN_2FA.
    """

    username = (
        request.data.get("username")
        or ""
    ).strip()

    code = (
        request.data.get("code")
        or ""
    ).strip()

    ip = get_client_ip(request)

    if not username:
        return Response(
            {
                "username": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not code:
        return Response(
            {
                "code": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        username=username,
        is_active=True,
        email_verified=True,
    ).first()

    if user is None:
        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid, reason = check_verification_code(
        user,
        VerificationCode.Purpose.LOGIN_2FA,
        code,
    )

    if not valid:
        log_action(
            "CONNEXION_2FA_ECHOUEE",
            user.id,
            {
                "username":
                    user.username,
                "ip":
                    ip,
                "reason":
                    reason,
            },
        )

        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    refresh = RefreshToken.for_user(
        user
    )

    log_action(
        "CONNEXION_REUSSIE",
        user.id,
        {
            "username":
                user.username,
            "ip":
                ip,
            "two_factor":
                "EMAIL",
        },
    )

    return Response(
        {
            "access":
                str(refresh.access_token),
            "refresh":
                str(refresh),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    return Response(
        {
            "id": user.id,
            "username": user.get_username(),
            "email": getattr(
                user,
                "email",
                "",
            ),
            "role": getattr(
                user,
                "role",
                "",
            ),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupRateThrottle])
def signup(request):
    username = (
        request.data.get("username")
        or ""
    ).strip()

    email = (
        request.data.get("email")
        or ""
    ).strip().lower()

    password = (
        request.data.get("password")
        or ""
    )

    if not username:
        return Response(
            {
                "username": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        return Response(
            {
                "email": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(
        username=username,
    ).exists():
        return Response(
            {
                "username": [
                    "Déjà utilisé."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(
        email__iexact=email,
    ).exists():
        return Response(
            {
                "email": [
                    "Email déjà utilisé."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(
            password
        )

    except ValidationError as exc:
        return Response(
            {
                "password": list(
                    exc.messages
                )
            },
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
        subject=(
            "Votre code de vérification "
            "Innov'Events"
        ),
        text_content=(
            f"Bonjour {user.username},\n\n"
            f"Votre code de vérification est : {code}\n\n"
            "Ce code est valable pendant 10 minutes.\n\n"
            "Si vous n'êtes pas à l'origine de cette "
            "inscription, vous pouvez ignorer ce message."
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
@throttle_classes([VerifyEmailRateThrottle])
def verify_email(request):
    email = (
        request.data.get("email")
        or ""
    ).strip().lower()

    code = (
        request.data.get("code")
        or ""
    ).strip()

    if not email:
        return Response(
            {
                "email": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not code:
        return Response(
            {
                "code": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email,
    ).first()

    if not user:
        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.email_verified:
        return Response(
            {
                "detail":
                    "Adresse e-mail déjà vérifiée."
            },
            status=status.HTTP_200_OK,
        )

    valid, reason = check_verification_code(
        user,
        VerificationCode.Purpose.EMAIL_VERIFICATION,
        code,
    )

    if not valid:
        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.email_verified = True

    user.save(
        update_fields=[
            "email_verified",
        ]
    )

    return Response(
        {
            "detail":
                "Adresse e-mail vérifiée avec succès."
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ResendCodeRateThrottle])
def resend_code(request):
    email = (
        request.data.get("email")
        or ""
    ).strip().lower()

    purpose = (
        request.data.get("purpose")
        or ""
    ).strip()

    if not email:
        return Response(
            {
                "email": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    allowed_purposes = [
        VerificationCode.Purpose.EMAIL_VERIFICATION,
        VerificationCode.Purpose.PASSWORD_RESET,
    ]

    if purpose not in allowed_purposes:
        return Response(
            {
                "purpose": [
                    "Type de code invalide."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email,
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
                "detail":
                    "Adresse e-mail déjà vérifiée."
            },
            status=status.HTTP_200_OK,
        )

    code, _ = create_verification_code(
        user,
        purpose,
    )

    if (
        purpose
        == VerificationCode.Purpose.EMAIL_VERIFICATION
    ):
        subject = (
            "Nouveau code de vérification "
            "Innov'Events"
        )

        message = (
            f"Bonjour {user.username},\n\n"
            f"Votre nouveau code de vérification est : {code}\n\n"
            "Ce code est valable pendant 10 minutes.\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, "
            "vous pouvez ignorer ce message."
        )

    else:
        subject = (
            "Nouveau code de réinitialisation "
            "Innov'Events"
        )

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
@throttle_classes([ForgotPasswordRateThrottle])
def forgot_password(request):
    email = (
        request.data.get("email")
        or ""
    ).strip().lower()

    generic_response = {
        "detail": (
            "Si cet email existe, "
            "un code de réinitialisation a été envoyé."
        )
    }

    if not email:
        return Response(
            {
                "email": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email,
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
        subject=(
            "Réinitialisation de votre mot "
            "de passe Innov'Events"
        ),
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
@throttle_classes([ResetPasswordRateThrottle])
def reset_password(request):
    email = (
        request.data.get("email")
        or ""
    ).strip().lower()

    code = (
        request.data.get("code")
        or ""
    ).strip()

    new_password = (
        request.data.get("password")
        or ""
    )

    if not email:
        return Response(
            {
                "email": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not code:
        return Response(
            {
                "code": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not new_password:
        return Response(
            {
                "password": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(
        email__iexact=email,
    ).first()

    if not user:
        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(
            new_password,
            user=user,
        )

    except ValidationError as exc:
        return Response(
            {
                "password": list(
                    exc.messages
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid, reason = check_verification_code(
        user,
        VerificationCode.Purpose.PASSWORD_RESET,
        code,
    )

    if not valid:
        return Response(
            {
                "detail":
                    "Code invalide ou expiré."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(
        new_password
    )

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
            "username":
                user.username,
        },
    )

    return Response(
        {
            "detail":
                "Mot de passe réinitialisé avec succès."
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    new_password = (
        request.data.get("password")
        or ""
    )

    if not new_password:
        return Response(
            {
                "password": [
                    "Obligatoire."
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(
            new_password,
            user=request.user,
        )

    except ValidationError as exc:
        return Response(
            {
                "password": list(
                    exc.messages
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.set_password(
        new_password
    )

    request.user.must_change_password = False

    request.user.save(
        update_fields=[
            "password",
            "must_change_password",
        ]
    )

    return Response(
        {
            "detail":
                "Mot de passe mis à jour."
        },
        status=status.HTTP_200_OK,
    )


class UserAdminRightsViewSet(
    viewsets.ReadOnlyModelViewSet
):
    """
    Consultation et gestion des rôles ADMIN.

    Seuls les ADMIN métier et les superusers
    peuvent accéder à ces opérations.

    User.role représente les droits métier.

    is_staff reste réservé à l'accès au Django Admin.
    """

    serializer_class = UserRightsSerializer

    permission_classes = [
        IsBusinessAdmin
    ]

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

        if (
            target_user.id
            == request.user.id
        ):
            return Response(
                {
                    "detail": (
                        "Vous ne pouvez pas modifier "
                        "vos propres droits."
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

        if (
            target_user.role
            == User.Role.ADMIN
        ):
            serializer = self.get_serializer(
                target_user
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        previous_role = target_user.role

        target_user.role = (
            User.Role.ADMIN
        )

        target_user.is_staff = False

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
                "target_user_id":
                    target_user.id,
                "target_username":
                    target_user.username,
                "previous_role":
                    previous_role,
                "new_role":
                    User.Role.ADMIN,
            },
        )

        serializer = self.get_serializer(
            target_user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
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

        if (
            target_user.id
            == request.user.id
        ):
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

        if (
            target_user.role
            != User.Role.ADMIN
        ):
            return Response(
                {
                    "detail": (
                        "Cet utilisateur n'est "
                        "pas administrateur."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_role = target_user.role

        target_user.role = (
            User.Role.CLIENT
        )

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
                "target_user_id":
                    target_user.id,
                "target_username":
                    target_user.username,
                "previous_role":
                    previous_role,
                "new_role":
                    User.Role.CLIENT,
            },
        )

        serializer = self.get_serializer(
            target_user
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )