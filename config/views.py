from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from rest_framework.permissions import AllowAny

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        })

class PublicConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "thank_you_message": getattr(settings, "THANK_YOU_MESSAGE", "Merci !"),
        })