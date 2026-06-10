from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ReviewSerializer
    queryset = Review.objects.select_related("author").all()

    def get_permissions(self):
        # Tout le monde peut voir les avis
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        # Un utilisateur connecté peut poster un avis
        if self.action == "create":
            return [IsAuthenticated()]

        # Seul l'admin peut supprimer un avis
        if self.action == "destroy":
            return [IsAdminUser()]

        return [IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)