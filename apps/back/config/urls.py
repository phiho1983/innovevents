from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from rest_framework_simplejwt.views import TokenRefreshView

from .views import MeView, PublicConfigView

from accounts.views import (
    signup,
    verify_email,
    LoggedTokenObtainPairView,
    forgot_password,
    reset_password,
    change_password,
    resend_code,
)


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/health/", health),

    path("api/", include("config.api_urls")),

    path(
        "api/login/",
        LoggedTokenObtainPairView.as_view(),
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
    ),

    path(
        "api/me/",
        MeView.as_view(),
    ),

    path(
        "api/public-config/",
        PublicConfigView.as_view(),
    ),

    path(
        "api/signup/",
        signup,
    ),

    path(
        "api/verify-email/",
        verify_email,
    ),

    path(
        "api/forgot-password/",
        forgot_password,
    ),

    path(
        "api/reset-password/",
        reset_password,
    ),

    path(
        "api/change-password/",
        change_password,
    ),

    path(
    "api/resend-code/",
    resend_code,
    ),
]