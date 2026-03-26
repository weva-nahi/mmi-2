"""
Permissions personnalisées basées sur les rôles (RBAC).
"""
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin


class IsDemandeur(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('DEMANDEUR')


class IsSecretariatCentral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('SEC_CENTRAL')


class IsSecretaireGeneral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('SEC_GENERAL')


class IsMinistre(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('MINISTRE')


class IsDGI(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_role('DGI_DIRECTEUR') or
            request.user.has_role('DGI_SECRETARIAT')
        )


class IsDGIDirecteur(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('DGI_DIRECTEUR')


class IsDDPI(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_role('DDPI_CHEF') or
            request.user.has_role('DDPI_AGENT')
        )


class IsMMISignataire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_role('MMI_SIGNATAIRE')


class IsAgentInstitutionnel(BasePermission):
    """Tout acteur sauf le demandeur (inclut le super admin)."""
    ROLES_AGENTS = [
        'SUPER_ADMIN', 'SEC_CENTRAL', 'SEC_GENERAL', 'MINISTRE',
        'DGI_DIRECTEUR', 'DGI_SECRETARIAT', 'DDPI_CHEF', 'DDPI_AGENT', 'MMI_SIGNATAIRE'
    ]

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Super admin a accès à tout
        if request.user.is_super_admin:
            return True
        return any(request.user.has_role(r) for r in self.ROLES_AGENTS)


class IsOwnerOrAgent(BasePermission):
    """Demandeur propriétaire ou agent institutionnel."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_super_admin:
            return True
        # Le demandeur ne voit que ses propres dossiers
        if request.user.has_role('DEMANDEUR'):
            return obj.demandeur_id == request.user.id
        # Les agents voient tous les dossiers
        return True