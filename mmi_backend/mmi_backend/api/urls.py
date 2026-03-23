"""
URLs API — MMI Platform
Tous les endpoints regroupés dans une seule application.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, InscriptionView,
    UserViewSet, RoleViewSet,
    ActualiteViewSet, DocumentPublicViewSet, ProjetBanqueViewSet,
    TypeDemandeViewSet, DemandeViewSet, NotificationViewSet,
    AutorisationViewSet, DocumentGenereViewSet,
    VisiteLieuxViewSet, ComiteBPViewSet, DistanceBoulangerieViewSet,
    RenouvellementDetailViewSet, ExtensionDetailViewSet,
    UsineEauDetailViewSet, UniteIndustrielleDetailViewSet,
    AnalyticsView,
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
router.register(r'types-demande',  TypeDemandeViewSet,   basename='type-demande')
router.register(r'demandes',       DemandeViewSet,        basename='demande')
router.register(r'notifications',  NotificationViewSet,   basename='notification')

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
    # Authentification
    path('auth/login/',           LoginView.as_view(),        name='auth-login'),
    path('auth/register/',        InscriptionView.as_view(),  name='auth-register'),
    path('auth/token/refresh/',   TokenRefreshView.as_view(), name='token-refresh'),

    # Analytics
    path('analytics/dashboard/', AnalyticsView.as_view(), name='analytics-dashboard'),

    # Tous les ViewSets
    path('', include(router.urls)),
]
