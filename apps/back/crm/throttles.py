from rest_framework.throttling import (
    SimpleRateThrottle,
)


class PublicIPRateThrottle(
    SimpleRateThrottle
):
    """
    Base de throttling pour les formulaires
    publics Innov'Events.

    La clé dépend uniquement de l'adresse IP,
    y compris si une requête possède
    accidentellement un JWT valide.
    """

    def get_cache_key(
        self,
        request,
        view,
    ):
        ident = self.get_ident(
            request
        )

        return self.cache_format % {
            "scope":
                self.scope,
            "ident":
                ident,
        }


class ContactMessageCreateThrottle(
    PublicIPRateThrottle
):
    """
    Limite l'envoi public de messages Contact.
    """

    scope = "contact_message_create"
    rate = "10/hour"


class ProspectCreateThrottle(
    PublicIPRateThrottle
):
    """
    Limite les demandes publiques de devis.
    """

    scope = "prospect_create"
    rate = "10/hour"