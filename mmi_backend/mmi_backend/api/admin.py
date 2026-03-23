from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Role, UserRole,
    Actualite, DocumentPublic, ProjetBanque,
    TypeDemande, Demande, EtapeTraitement, PieceRequise, PieceJointe, Notification,
    Autorisation, DocumentGenere,
    VisiteLieux, ComiteBP, DistanceBoulangerie,
    RenouvellementDetail, ExtensionDetail, UsineEauDetail, UniteIndustrielleDetail,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['identifiant_unique', 'nom', 'prenom', 'email', 'nom_entreprise', 'is_active']
    list_filter   = ['is_active', 'is_super_admin']
    search_fields = ['nom', 'prenom', 'email', 'identifiant_unique', 'nom_entreprise']
    ordering      = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Identité', {'fields': ('nom', 'prenom', 'telephone', 'identifiant_unique', 'email_recuperation')}),
        ('Entreprise', {'fields': ('nom_entreprise', 'forme_juridique', 'nif', 'adresse_siege')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_super_admin', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {'fields': ('email', 'nom', 'prenom', 'password1', 'password2')}),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom', 'niveau']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'actif', 'assigned_at']
    list_filter  = ['role', 'actif']


@admin.register(TypeDemande)
class TypeDemandeAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'actif']


@admin.register(Demande)
class DemandeAdmin(admin.ModelAdmin):
    list_display  = ['numero_ref', 'raison_sociale', 'type_demande', 'statut', 'wilaya', 'date_soumission']
    list_filter   = ['statut', 'type_demande', 'wilaya']
    search_fields = ['numero_ref', 'raison_sociale']
    ordering      = ['-date_soumission']


@admin.register(EtapeTraitement)
class EtapeTraitementAdmin(admin.ModelAdmin):
    list_display = ['demande', 'etape_code', 'statut_avant', 'statut_apres', 'acteur', 'date_action']
    list_filter  = ['etape_code']


@admin.register(PieceRequise)
class PieceRequiseAdmin(admin.ModelAdmin):
    list_display = ['type_demande', 'nom', 'obligatoire', 'has_statut', 'has_cahier_charges', 'ordre']
    list_filter  = ['type_demande', 'obligatoire']


@admin.register(Autorisation)
class AutorisationAdmin(admin.ModelAdmin):
    list_display = ['numero_auto', 'type', 'statut', 'wilaya', 'date_delivrance']
    list_filter  = ['type', 'statut', 'wilaya']


admin.site.register(Actualite)
admin.site.register(DocumentPublic)
admin.site.register(ProjetBanque)
admin.site.register(PieceJointe)
admin.site.register(Notification)
admin.site.register(DocumentGenere)
admin.site.register(VisiteLieux)
admin.site.register(ComiteBP)
admin.site.register(DistanceBoulangerie)
admin.site.register(RenouvellementDetail)
admin.site.register(ExtensionDetail)
admin.site.register(UsineEauDetail)
admin.site.register(UniteIndustrielleDetail)

admin.site.site_header = "MMI — Administration"
admin.site.site_title  = "Plateforme MMI"
admin.site.index_title = "Gestion de la plateforme"
