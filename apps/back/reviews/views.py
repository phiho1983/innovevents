from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny

from accounts.permissions import (
    IsBusinessAdmin,
    IsClient,
)

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Gestion des avis.

    VISITEUR :
    - peut consulter les avis.

    CLIENT :
    - peut consulter les avis.
    - peut publier un avis.

    EMPLOYEE :
    - peut consulter les avis.

    ADMIN :
    - peut consulter les avis.
    - peut supprimer un avis.

    Les permissions métier reposent sur User.role
    et non sur is_staff.
    """

    serializer_class = ReviewSerializer

    queryset = (
        Review.objects
        .select_related("author")
        .all()
    )

    def get_permissions(self):
        # Lecture publique.
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [AllowAny()]

        # Seuls les CLIENTS peuvent publier un avis.
        if self.action == "create":
            return [IsClient()]

        # Suppression réservée à l'ADMIN métier.
        if self.action == "destroy":
            return [IsBusinessAdmin()]

        return [IsBusinessAdmin()]

    def perform_create(self, serializer):
        # L'auteur est toujours l'utilisateur connecté.
        # Impossible d'injecter un autre author
        # depuis le payload.
        serializer.save(
            author=self.request.user
        )