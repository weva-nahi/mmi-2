"""
URLs API — MMI Platform
Tous les endpoints regroupés dans une seule application.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginAgentView,
    PasswordChangeView,
    PasswordResetRequestView,
    LoginView, InscriptionView,
    UserViewSet, RoleViewSet,
    ActualiteViewSet, DocumentPublicViewSet, ProjetBanqueViewSet,
    TypeDemandeViewSet, DemandeViewSet, NotificationViewSet,
    AutorisationViewSet, DocumentGenereViewSet,
    VisiteLieuxViewSet, ComiteBPViewSet, DistanceBoulangerieViewSet,
    RenouvellementDetailViewSet, ExtensionDetailViewSet,
    UsineEauDetailViewSet, UniteIndustrielleDetailViewSet,
    AnalyticsView,
    PieceRequiseViewSet,
)
from api.views import (
    DGIAnalyticsView, ExportView,
    AdminActualiteView, AdminActualiteDetailView,
    AdminDocumentView, AdminStatsView, AdminUserDetailView,
    ActivationCompteView, ConfigPlateformeView,
    ResetPasswordConfirmView, BackupDatabaseView,
    AutorisationByNumeroView, LierAutorisationRenouvellementView,
    ContactView,
)

router = DefaultRouter()

# Auth & users
router.register(r'admin/users',  UserViewSet,      basename='user')
router.register(r'roles',         RoleViewSet,      basename='role')

# Portail public
router.register(r'public/actualites',   ActualiteViewSet,      basename='actualite')
router.register(r'public/documents',    DocumentPublicViewSet, basename='document-public')
router.register(r'public/projets',      ProjetBanqueViewSet,   basename='projet-banque')

# Demandes
router.register(r'types-demande',   TypeDemandeViewSet,   basename='type-demande')
router.register(r'pieces-requises', PieceRequiseViewSet,  basename='piece-requise')
router.register(r'demandes',        DemandeViewSet,        basename='demande')
router.register(r'notifications',   NotificationViewSet,   basename='notification')

# Autorisations & documents
router.register(r'autorisations',  AutorisationViewSet,   basename='autorisation')
router.register(r'documents',      DocumentGenereViewSet, basename='document-genere')

# Métier spécifique
router.register(r'visites',                  VisiteLieuxViewSet,              basename='visite')
router.register(r'comites-bp',               ComiteBPViewSet,                 basename='comite-bp')
router.register(r'distances-boulangerie',    DistanceBoulangerieViewSet,      basename='distance')
router.register(r'details/renouvellement',   RenouvellementDetailViewSet,     basename='detail-renouvellement')
router.register(r'details/extension',        ExtensionDetailViewSet,          basename='detail-extension')
router.register(r'details/usine-eau',        UsineEauDetailViewSet,           basename='detail-usine-eau')
router.register(r'details/unite',            UniteIndustrielleDetailViewSet,  basename='detail-unite')

urlpatterns = [
    # ── Authentification ──────────────────────────────────────
    path('auth/login/',                       LoginView.as_view(),              name='auth-login'),
    path('auth/login/agent/',                 LoginAgentView.as_view(),         name='auth-login-agent'),
    path('auth/register/',                    InscriptionView.as_view(),        name='auth-register'),
    path('auth/token/refresh/',               TokenRefreshView.as_view(),       name='token-refresh'),
    path('auth/password-change/',             PasswordChangeView.as_view(),     name='password-change'),
    path('auth/password-reset/',              PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/reset-password-confirm/',      ResetPasswordConfirmView.as_view(), name='reset-password-confirm'),
    path('auth/reset-password/<str:uidb64>/<str:token>/', ResetPasswordConfirmView.as_view(), name='reset-password-link'),
    path('auth/activer/<str:uidb64>/<str:token>/',        ActivationCompteView.as_view(), name='activer-compte'),

    # ── Analytics & export ────────────────────────────────────
    path('analytics/dashboard/',              AnalyticsView.as_view(),          name='analytics-dashboard'),
    path('analytics/dgi/',                    DGIAnalyticsView.as_view(),       name='analytics-dgi'),
    path('export/renouvellements/',           ExportView.as_view(),             name='export-renouvellements'),

    # ── Administration ────────────────────────────────────────
    path('admin/stats/',                      AdminStatsView.as_view(),          name='admin-stats'),
    path('admin/actualites/',                 AdminActualiteView.as_view(),      name='admin-actualites'),
    path('admin/actualites/<int:pk>/',        AdminActualiteDetailView.as_view(),name='admin-actualite-detail'),
    path('admin/documents/',                  AdminDocumentView.as_view(),       name='admin-documents'),
    path('admin/documents/<int:pk>/',         AdminDocumentView.as_view(),       name='admin-document-detail'),
    path('admin/users/<int:pk>/',             AdminUserDetailView.as_view(),     name='admin-user-detail'),
    path('admin/config-plateforme/',          ConfigPlateformeView.as_view(),    name='config-plateforme'),
    path('admin/backup/',                     BackupDatabaseView.as_view(),      name='admin-backup'),

    # ── Actions spéciales sur demandes ────────────────────────
    path('autorisations/by-numero/',          AutorisationByNumeroView.as_view(),               name='autorisation-by-numero'),
    path('demandes/<int:pk>/lier-autorisation/', LierAutorisationRenouvellementView.as_view(),  name='lier-autorisation'),

    # ── Portail public contact ────────────────────────────────
    path('contact/',                          ContactView.as_view(),             name='contact'),

    # ── ViewSets (router) ─────────────────────────────────────
    path('', include(router.urls)),
]