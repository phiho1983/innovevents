from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
        })


class PublicConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "thank_you_message": getattr(settings, "THANK_YOU_MESSAGE", "Merci !"),
        })
