"""
Views DRF — MMI Platform
Tous les ViewSets dans une seule application.
"""
from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
import logging

from .models import (
    User, Role, UserRole,
    Actualite, DocumentPublic, ProjetBanque,
    TypeDemande, Demande, EtapeTraitement, PieceRequise, PieceJointe, Notification,
    Autorisation, DocumentGenere,
    VisiteLieux, ComiteBP, DistanceBoulangerie,
    RenouvellementDetail, ExtensionDetail, UsineEauDetail, UniteIndustrielleDetail,
)
from .serializers import (
    CustomTokenObtainPairSerializer, InscriptionSerializer,
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    RoleSerializer, UserRoleSerializer,
    ActualiteSerializer, DocumentPublicSerializer, ProjetBanqueSerializer,
    TypeDemandeSerializer, PieceRequiseSerializer, PieceJointeSerializer,
    DemandeListSerializer, DemandeDetailSerializer,
    EtapeTraitementSerializer, TransitionStatutSerializer,
    NotificationSerializer,
    AutorisationSerializer, AutorisationGeoJSONSerializer, DocumentGenereSerializer,
    VisiteLieuxSerializer, ComiteBPSerializer, DistanceBoulangerieSerializer,
    RenouvellementDetailSerializer, ExtensionDetailSerializer,
    UsineEauDetailSerializer, UniteIndustrielleDetailSerializer,
)
from .permissions import (
    IsSuperAdmin, IsDemandeur, IsSecretariatCentral, IsSecretaireGeneral,
    IsMinistre, IsDGI, IsDGIDirecteur, IsDDPI, IsMMISignataire,
    IsAgentInstitutionnel, IsOwnerOrAgent,
)

logger = logging.getLogger('api')


# ─────────────────────────────────────────────────────────────
# AUTHENTIFICATION
# ─────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — connexion via identifiant_unique + password."""
    permission_classes = [AllowAny]
    serializer_class   = CustomTokenObtainPairSerializer


class InscriptionView(generics.CreateAPIView):
    """POST /api/auth/register/ — auto-inscription du demandeur."""
    permission_classes = [AllowAny]
    serializer_class   = InscriptionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Compte créé avec succès. Votre identifiant a été envoyé par email.',
            'identifiant_unique': user.identifiant_unique,
            'email': user.email,
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# UTILISATEURS & RÔLES (Super Admin)
# ─────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD utilisateurs — réservé Super Admin.
    GET /api/admin/users/
    POST /api/admin/users/
    """
    queryset           = User.objects.all().order_by('-created_at')
    permission_classes = [IsSuperAdmin]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    search_fields      = ['nom', 'prenom', 'email', 'nom_entreprise', 'identifiant_unique']
    filterset_fields   = ['is_active', 'is_super_admin']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return UserDetailSerializer
        return UserListSerializer

    @action(detail=True, methods=['post'], url_path='attribuer-role')
    def attribuer_role(self, request, pk=None):
        """POST /api/admin/users/{id}/attribuer-role/ — attribuer un rôle."""
        user = self.get_object()
        role_code = request.data.get('role_code')
        try:
            role = Role.objects.get(code=role_code)
        except Role.DoesNotExist:
            return Response({'error': 'Rôle introuvable.'}, status=400)
        ur, created = UserRole.objects.get_or_create(
            user=user, role=role,
            defaults={'assigned_by': request.user, 'actif': True}
        )
        if not created:
            ur.actif = True; ur.save()
        return Response({'message': f"Rôle {role_code} attribué à {user.nom_complet}."})

    @action(detail=True, methods=['post'], url_path='activer')
    def activer(self, request, pk=None):
        """Activer ou suspendre un compte."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        action_label = "activé" if user.is_active else "suspendu"
        return Response({'message': f"Compte {action_label}.", 'is_active': user.is_active})


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = Role.objects.all()
    serializer_class   = RoleSerializer
    permission_classes = [IsAgentInstitutionnel]


# ─────────────────────────────────────────────────────────────
# PORTAIL PUBLIC
# ─────────────────────────────────────────────────────────────

class ActualiteViewSet(viewsets.ModelViewSet):
    serializer_class = ActualiteSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['titre', 'contenu']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_super_admin:
            return Actualite.objects.all()
        return Actualite.objects.filter(publie=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


class DocumentPublicViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentPublicSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['categorie', 'langue', 'publie']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_super_admin:
            return DocumentPublic.objects.all()
        return DocumentPublic.objects.filter(publie=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjetBanqueViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetBanqueSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['statut', 'secteur', 'publie']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_super_admin:
            return ProjetBanque.objects.all()
        return ProjetBanque.objects.filter(publie=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ─────────────────────────────────────────────────────────────
# DEMANDES
# ─────────────────────────────────────────────────────────────

class TypeDemandeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset           = TypeDemande.objects.filter(actif=True)
    serializer_class   = TypeDemandeSerializer
    permission_classes = [AllowAny]


class DemandeViewSet(viewsets.ModelViewSet):
    """
    CRUD demandes avec gestion des droits par rôle.
    Le demandeur ne voit que ses propres dossiers.
    Les agents voient tous les dossiers selon leur rôle.
    """
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'type_demande__code', 'wilaya']
    search_fields    = ['numero_ref', 'raison_sociale', 'activite']
    ordering_fields  = ['date_soumission', 'date_maj', 'statut']
    ordering         = ['-date_soumission']

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Demande.objects.select_related('demandeur', 'type_demande').all()
        if user.has_role('DEMANDEUR'):
            return Demande.objects.filter(demandeur=user)
        # Tous les agents voient toutes les demandes
        return Demande.objects.select_related('demandeur', 'type_demande').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return DemandeListSerializer
        return DemandeDetailSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsDemandeur()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], url_path='transmettre',
            permission_classes=[IsAgentInstitutionnel])
    def transmettre(self, request, pk=None):
        """
        POST /api/demandes/{id}/transmettre/
        Effectue une transition de statut avec enregistrement dans le journal.
        """
        demande = self.get_object()
        serializer = TransitionStatutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        statut_avant = demande.statut

        # Mapping etape_code → nouveau statut
        TRANSITIONS = {
            'SC_RECEPTION':          'EN_RECEPTION',
            'SC_TRANSMISSION_SG':    'TRANSMISE_SG',
            'SG_LECTURE':            'EN_LECTURE_SG',
            'SG_TRANSMISSION_MIN':   'TRANSMISE_MINISTRE',
            'SG_TRANSMISSION_DGI':   'EN_INSTRUCTION_DGI',
            'MIN_LECTURE':           'EN_LECTURE_MINISTRE',
            'MIN_TRANSMISSION_DGI':  'EN_INSTRUCTION_DGI',
            'DGI_INSTRUCTION':       'EN_INSTRUCTION_DGI',
            'DGI_TRANSMISSION_DDPI': 'EN_TRAITEMENT_DDPI',
            'DDPI_VERIFICATION':     'EN_TRAITEMENT_DDPI',
            'DDPI_INCOMPLET':        'DOSSIER_INCOMPLET',
            'DDPI_VISITE':           'VISITE_PROGRAMMEE',
            'DDPI_COMMISSION_BP':    'EN_COMMISSION_BP',
            'DDPI_ACCORD_PRINCIPE':  'ACCORD_PRINCIPE',
            'DDPI_REJET':            'REJETE',
            'DDPI_CHEF_SERVICE':     'EN_TRAITEMENT_DDPI',
            'DGI_SIGNATURE':         'SIGNATURE_DGI',
            'MMI_SIGNATURE':         'SIGNATURE_MMI',
            'SYSTEME_VALIDATION':    'VALIDE',
        }

        nouveau_statut = TRANSITIONS.get(data['etape_code'])
        if nouveau_statut:
            demande.statut = nouveau_statut
            demande.save()

        EtapeTraitement.objects.create(
            demande=demande,
            acteur=request.user,
            etape_code=data['etape_code'],
            statut_avant=statut_avant,
            statut_apres=demande.statut,
            action=data['action'],
            commentaire=data.get('commentaire', ''),
        )

        logger.info(f"Demande {demande.numero_ref} : {statut_avant} → {demande.statut} par {request.user.nom_complet}")

        return Response({
            'message': 'Transition effectuée.',
            'numero_ref': demande.numero_ref,
            'statut_avant': statut_avant,
            'statut_apres': demande.statut,
        })

    @action(detail=True, methods=['get'], url_path='historique')
    def historique(self, request, pk=None):
        """GET /api/demandes/{id}/historique/ — journal d'audit complet."""
        demande = self.get_object()
        etapes  = demande.etapes.all()
        return Response(EtapeTraitementSerializer(etapes, many=True).data)

    @action(detail=True, methods=['post'], url_path='upload-piece',
            permission_classes=[IsDemandeur])
    def upload_piece(self, request, pk=None):
        """POST /api/demandes/{id}/upload-piece/ — upload d'une pièce jointe."""
        demande = self.get_object()
        if demande.demandeur != request.user:
            return Response({'error': 'Accès refusé.'}, status=403)

        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'error': 'Aucun fichier fourni.'}, status=400)

        piece = PieceJointe.objects.create(
            demande=demande,
            piece_requise_id=request.data.get('piece_requise_id'),
            nom_original=fichier.name,
            fichier=fichier,
            taille_ko=fichier.size // 1024,
        )
        return Response(PieceJointeSerializer(piece).data, status=201)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Notifications de l'utilisateur connecté."""
    serializer_class   = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='marquer-lu')
    def marquer_lu(self, request, pk=None):
        notif = self.get_object()
        notif.lu = True; notif.save()
        return Response({'lu': True})

    @action(detail=False, methods=['post'], url_path='tout-lire')
    def tout_lire(self, request):
        self.get_queryset().update(lu=True)
        return Response({'message': 'Toutes les notifications marquées comme lues.'})


# ─────────────────────────────────────────────────────────────
# AUTORISATIONS
# ─────────────────────────────────────────────────────────────

class AutorisationViewSet(viewsets.ModelViewSet):
    queryset           = Autorisation.objects.all()
    serializer_class   = AutorisationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['type', 'statut', 'wilaya']

    @action(detail=False, methods=['get'], url_path='geojson', permission_classes=[AllowAny])
    def geojson(self, request):
        """
        GET /api/autorisations/geojson/
        Données publiques pour la cartographie Leaflet.
        """
        qs = Autorisation.objects.filter(
            statut='active', latitude__isnull=False, longitude__isnull=False
        )
        features = []
        for a in qs:
            features.append({
                'type': 'Feature',
                'geometry': {'type': 'Point', 'coordinates': [a.longitude, a.latitude]},
                'properties': {
                    'id': a.id, 'numero_auto': a.numero_auto,
                    'type': a.type, 'wilaya': a.wilaya,
                    'adresse': a.adresse, 'date_delivrance': str(a.date_delivrance),
                }
            })
        return Response({'type': 'FeatureCollection', 'features': features})

    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[AllowAny])
    def stats(self, request):
        """GET /api/autorisations/stats/ — statistiques pour le panel de la carte."""
        from django.db.models import Count
        qs = Autorisation.objects.filter(statut='active')
        total = qs.count()
        par_type = qs.values('type').annotate(count=Count('id'))
        return Response({'total': total, 'par_type': list(par_type)})


class DocumentGenereViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = DocumentGenereSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.has_role('DEMANDEUR'):
            return DocumentGenere.objects.filter(
                demande__demandeur=user, signe=True
            )
        return DocumentGenere.objects.all()

    @action(detail=True, methods=['post'], url_path='signer',
            permission_classes=[IsDGIDirecteur])
    def signer(self, request, pk=None):
        """POST /api/documents/{id}/signer/ — signature numérique du document."""
        doc = self.get_object()
        doc.signe = True
        doc.signataire = request.user
        doc.signataire_role = request.user.get_roles()[0] if request.user.get_roles() else ''
        doc.date_signature = timezone.now()
        doc.save()
        return Response({'message': 'Document signé.', 'date_signature': doc.date_signature})


# ─────────────────────────────────────────────────────────────
# MÉTIER SPÉCIFIQUE
# ─────────────────────────────────────────────────────────────

class VisiteLieuxViewSet(viewsets.ModelViewSet):
    queryset           = VisiteLieux.objects.all()
    serializer_class   = VisiteLieuxSerializer
    permission_classes = [IsDDPI]


class ComiteBPViewSet(viewsets.ModelViewSet):
    queryset           = ComiteBP.objects.all()
    serializer_class   = ComiteBPSerializer
    permission_classes = [IsDDPI]


class DistanceBoulangerieViewSet(viewsets.ModelViewSet):
    queryset           = DistanceBoulangerie.objects.all()
    serializer_class   = DistanceBoulangerieSerializer
    permission_classes = [IsDDPI]


class RenouvellementDetailViewSet(viewsets.ModelViewSet):
    queryset           = RenouvellementDetail.objects.all()
    serializer_class   = RenouvellementDetailSerializer
    permission_classes = [IsAuthenticated]


class ExtensionDetailViewSet(viewsets.ModelViewSet):
    queryset           = ExtensionDetail.objects.all()
    serializer_class   = ExtensionDetailSerializer
    permission_classes = [IsAuthenticated]


class UsineEauDetailViewSet(viewsets.ModelViewSet):
    queryset           = UsineEauDetail.objects.all()
    serializer_class   = UsineEauDetailSerializer
    permission_classes = [IsAuthenticated]


class UniteIndustrielleDetailViewSet(viewsets.ModelViewSet):
    queryset           = UniteIndustrielleDetail.objects.all()
    serializer_class   = UniteIndustrielleDetailSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────────────────────
# ANALYTICS (tableau de bord)
# ─────────────────────────────────────────────────────────────

class AnalyticsView(generics.GenericAPIView):
    """GET /api/analytics/dashboard/ — données pour le tableau de bord."""
    permission_classes = [IsAgentInstitutionnel]

    def get(self, request):
        from django.db.models import Count
        user = request.user

        qs_demandes = Demande.objects.all()
        if user.has_role('DEMANDEUR'):
            qs_demandes = qs_demandes.filter(demandeur=user)

        total         = qs_demandes.count()
        par_statut    = list(qs_demandes.values('statut').annotate(count=Count('id')))
        par_type      = list(qs_demandes.values('type_demande__code').annotate(count=Count('id')))
        par_wilaya    = list(qs_demandes.values('wilaya').annotate(count=Count('id')).order_by('-count')[:10])
        recentes      = DemandeListSerializer(
            qs_demandes.order_by('-date_soumission')[:5], many=True
        ).data

        return Response({
            'total_demandes':  total,
            'par_statut':      par_statut,
            'par_type':        par_type,
            'par_wilaya':      par_wilaya,
            'demandes_recentes': recentes,
            'autorisations_actives': Autorisation.objects.filter(statut='active').count(),
        })
