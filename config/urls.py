from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import MeView
from .views import MeView, PublicConfigView




def health(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/", include("config.api_urls")),
    path("api/login/", TokenObtainPairView.as_view()),
    path("api/me/", MeView.as_view()),
    path("api/public-config/", PublicConfigView.as_view()),



]




