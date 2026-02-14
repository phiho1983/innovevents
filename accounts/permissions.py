from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """
    Autorise uniquement les utilisateurs connectés avec is_staff=True
    (Admin / Employé)
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsClient(BasePermission):
    """
    Autorise uniquement les utilisateurs connectés avec is_staff=False
    (Client)
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not request.user.is_staff)
