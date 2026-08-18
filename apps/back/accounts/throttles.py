from rest_framework.throttling import UserRateThrottle


class LoginRateThrottle(UserRateThrottle):
    """
    Protection de la première étape de connexion :
    identifiant + mot de passe.

    Pour un utilisateur anonyme,
    DRF utilise notamment son adresse IP.
    """

    scope = "login"
    rate = "10/min"


class Login2FARateThrottle(UserRateThrottle):
    """
    Protection de la seconde étape de connexion :
    validation du code reçu par e-mail.
    """

    scope = "login_2fa"
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