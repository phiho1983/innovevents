import requests

from django.conf import settings
from django.core.mail import send_mail


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_transactional_email(
    *,
    recipient_email,
    subject,
    text_content,
):
    """
    Envoie un e-mail transactionnel.

    Local :
    SMTP Django -> Mailpit

    Production :
    API HTTPS -> Brevo
    """

    if not settings.BREVO_API_KEY:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=None,
            recipient_list=[recipient_email],
            fail_silently=False,
        )

        return

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": recipient_email,
            }
        ],
        "subject": subject,
        "textContent": text_content,
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY,
    }

    response = requests.post(
        BREVO_API_URL,
        json=payload,
        headers=headers,
        timeout=10,
    )

    response.raise_for_status()