from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        "id": u.id,
        "username": u.get_username(),
        "email": getattr(u, "email", ""),
        "is_staff": u.is_staff,
        "is_superuser": u.is_superuser,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = (request.data.get("username") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""

    if not username:
        return Response({"username": ["Ce champ est obligatoire."]}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"password": ["8 caractères minimum."]}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"username": ["Ce nom d'utilisateur existe déjà."]}, status=status.HTTP_400_BAD_REQUEST)
    if email and User.objects.filter(email=email).exists():
        return Response({"email": ["Cet email est déjà utilisé."]}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.is_staff = False  # CLIENT
    user.save(update_fields=["is_staff"])

    return Response(
        {"id": user.id, "username": user.username, "email": user.email, "is_staff": user.is_staff},
        status=status.HTTP_201_CREATED,
    )
