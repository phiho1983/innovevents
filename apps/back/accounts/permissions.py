from rest_framework.permissions import BasePermission

from .models import User


class IsInternalUser(BasePermission):
    """
    Autorise les utilisateurs internes Innov'Events :
    - ADMIN
    - EMPLOYEE
    - superuser Django

    is_staff n'est pas utilisé comme rôle métier.
    """

    message = "Accès réservé aux utilisateurs internes."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role in (
                    User.Role.ADMIN,
                    User.Role.EMPLOYEE,
                )
            )
        )


class IsBusinessAdmin(BasePermission):
    """
    Autorise uniquement :
    - les ADMIN Innov'Events
    - les superusers Django
    """

    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role == User.Role.ADMIN
            )
        )


class IsEmployee(BasePermission):
    """
    Autorise uniquement les utilisateurs ayant le rôle EMPLOYEE.

    Un superuser reste autorisé pour l'administration technique.
    """

    message = "Accès réservé aux employés."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role == User.Role.EMPLOYEE
            )
        )


class IsClient(BasePermission):
    """
    Autorise uniquement les utilisateurs ayant le rôle CLIENT.

    La permission ne dépend jamais de is_staff.
    """

    message = "Accès réservé aux clients."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.role == User.Role.CLIENT
        )


class IsStaff(BasePermission):
    """
    Permission conservée temporairement pour compatibilité
    avec le code existant.

    IMPORTANT :
    elle représente désormais un utilisateur INTERNE métier
    et non simplement Django is_staff=True.

    À terme, les vues devront utiliser explicitement
    IsInternalUser ou IsBusinessAdmin.
    """

    message = "Accès réservé aux utilisateurs internes."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or user.role in (
                    User.Role.ADMIN,
                    User.Role.EMPLOYEE,
                )
            )
        )