from django.urls import path
from .views import me, signup

urlpatterns = [
    path("me/", me),
    path("signup/", signup),
]
