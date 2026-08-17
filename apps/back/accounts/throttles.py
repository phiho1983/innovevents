from rest_framework.throttling import UserRateThrottle


class LoginRateThrottle(UserRateThrottle):
    """
    Protection de la connexion.

    Utilisateur authentifié :
    clé basée sur son ID.

    Utilisateur anonyme :
    clé basée sur son adresse IP.
    """

    scope = "login"
    rate = "10/min"


class SignupRateThrottle(UserRateThrottle):
    """
    Limite la création massive de comptes.
    """

    scope = "signup"
    rate = "5/hour"


class VerifyEmailRateThrottle(UserRateThrottle):
    """
    Limite les tentatives de vérification
    d'une adresse e-mail.
    """

    scope = "verify_email"
    rate = "10/min"


class ResendCodeRateThrottle(UserRateThrottle):
    """
    Limite les demandes répétées
    de nouveaux codes.
    """

    scope = "resend_code"
    rate = "5/hour"


class ForgotPasswordRateThrottle(UserRateThrottle):
    """
    Limite les demandes de codes
    de réinitialisation.
    """

    scope = "forgot_password"
    rate = "5/hour"


class ResetPasswordRateThrottle(UserRateThrottle):
    """
    Limite les tentatives de validation
    d'un code de réinitialisation.
    """

    scope = "reset_password"
    rate = "10/hour"