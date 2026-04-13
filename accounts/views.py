from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from config.mongo import log_action
from django.utils.crypto import get_random_string
from django.core.mail import send_mail

User = get_user_model()

class LoggedTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        ip = (
            request.META.get("HTTP_X_FORWARDED_FOR","").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR","inconnue")
        )
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get("username","")
            user = User.objects.filter(username=username).first()
            log_action("CONNEXION_REUSSIE", user.id if user else None,
                       {"username": username, "ip": ip})
        else:
            log_action("CONNEXION_ECHOUEE", None,
                       {"username_tente": request.data.get("username",""), "ip": ip})
        return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({"id":u.id,"username":u.get_username(),
                     "email":getattr(u,"email",""),"is_staff":u.is_staff})

@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    username = (request.data.get("username") or "").strip()
    email    = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    if not username:
        return Response({"username":["Obligatoire."]}, status=400)
    if len(password) < 8:
        return Response({"password":["8 caractères minimum."]}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"username":["Déjà utilisé."]}, status=400)
    if email and User.objects.filter(email=email).exists():
        return Response({"email":["Email déjà utilisé."]}, status=400)
    user = User.objects.create_user(username=username,email=email,password=password)
    user.is_staff = False; user.save(update_fields=["is_staff"])
    return Response({"id":user.id,"username":user.username,"email":user.email}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email=(request.data.get("email") or "").strip()
    user=User.objects.filter(email=email).first()
    if not user:
        return Response({"detail":"Si cet email existe, un mail a été envoyé."},status=200)
    tmp=get_random_string(16)
    user.set_password(tmp)
    user.must_change_password=True
    user.save()
    send_mail("Réinitialisation de votre mot de passe Innov'Events",
        f"Votre nouveau mot de passe temporaire : {tmp}\n\nVous devrez le modifier à la prochaine connexion.",
        None,[email],fail_silently=True)
    return Response({"detail":"Si cet email existe, un mail a été envoyé."},status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    new_pwd=request.data.get("password","")
    if len(new_pwd)<8:
        return Response({"password":["8 caractères minimum."]},status=400)
    request.user.set_password(new_pwd)
    request.user.must_change_password=False
    request.user.save()
    return Response({"detail":"Mot de passe mis à jour."})