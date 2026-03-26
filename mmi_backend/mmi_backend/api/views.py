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
        'ARRETE_EN_COURS':       'ARRETE_EN_COURS',
            'DDPI_REJET':            'REJETE',
            'DDPI_CHEF_SERVICE':     'EN_TRAITEMENT_DDPI',
        'DDPI_ARRETE_REDACTION':  'ARRETE_EN_COURS',
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


class LoginAgentView(generics.GenericAPIView):
    """
    POST /api/auth/login/agent/
    Connexion des agents et administrateurs via email + password.
    Les demandeurs utilisent /api/auth/login/ avec identifiant_unique.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Email et mot de passe obligatoires.'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Email ou mot de passe incorrect.'}, status=401)

        if not user.check_password(password):
            return Response({'detail': 'Email ou mot de passe incorrect.'}, status=401)

        if not user.is_active:
            return Response({'detail': 'Compte désactivé. Contactez l\'administrateur.'}, status=403)

        # Bloquer les demandeurs — ils ont leur propre page de connexion
        roles = user.get_roles()
        if roles == ['DEMANDEUR']:
            return Response(
                {'detail': 'Les demandeurs utilisent l\'espace demandeur avec leur identifiant MMI-DEM-XXXXX.'},
                status=403
            )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        # Mettre à jour last_login
        from django.utils import timezone
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])

        from .serializers import UserDetailSerializer
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserDetailSerializer(user).data,
        })


class PasswordChangeView(generics.GenericAPIView):
    """POST /api/auth/password-change/ — changer son propre mot de passe."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old  = request.data.get('old_password', '')
        new  = request.data.get('new_password', '')
        if not user.check_password(old):
            return Response({'detail': 'Mot de passe actuel incorrect.'}, status=400)
        if len(new) < 8:
            return Response({'detail': 'Le mot de passe doit contenir au moins 8 caractères.'}, status=400)
        user.set_password(new)
        user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})


class PasswordResetRequestView(generics.GenericAPIView):
    """POST /api/auth/password-reset/ — demande de réinitialisation par email."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        # Toujours retourner 200 pour ne pas révéler si l'email existe
        try:
            user = User.objects.get(email=email, is_active=True)
            from django.core.mail import send_mail
            from django.conf import settings
            import secrets
            token = secrets.token_urlsafe(32)
            # En production : stocker le token en cache Redis avec expiration 1h
            # Ici : envoi simple
            reset_url = f"https://industrie.mmi.gov.mr/reset-password/{token}"
            send_mail(
                subject="Réinitialisation de votre mot de passe — MMI",
                message=f"Cliquez sur ce lien pour réinitialiser votre mot de passe :\n\n{reset_url}\n\nCe lien expire dans 1 heure.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        return Response({'detail': 'Si cet email existe, un lien de réinitialisation a été envoyé.'})


# ─────────────────────────────────────────────────────────────
# ANALYTICS AVANCÉ — DGI + Export
# ─────────────────────────────────────────────────────────────

class DGIAnalyticsView(generics.GenericAPIView):
    """GET /api/analytics/dgi/ — tableau de bord complet DGI avec données renouvellement."""
    permission_classes = [IsAgentInstitutionnel]

    def get(self, request):
        from django.db.models import Count, Q, Avg
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        debut_annee = today.replace(month=1, day=1)

        qs = Demande.objects.all()

        # KPIs généraux
        kpis = {
            'total_demandes':        qs.count(),
            'en_cours':              qs.exclude(statut__in=['VALIDE','REJETE']).count(),
            'valides_annee':         qs.filter(statut='VALIDE', date_soumission__date__gte=debut_annee).count(),
            'rejetes':               qs.filter(statut='REJETE').count(),
            'autorisations_actives': Autorisation.objects.filter(statut='active').count(),
            'en_instruction_dgi':    qs.filter(statut='EN_INSTRUCTION_DGI').count(),
            'en_attente_signature':  qs.filter(statut='SIGNATURE_DGI').count(),
        }

        # Par type de demande
        par_type = list(
            qs.values('type_demande__code', 'type_demande__libelle')
              .annotate(total=Count('id'),
                        valides=Count('id', filter=Q(statut='VALIDE')),
                        en_cours=Count('id', filter=~Q(statut__in=['VALIDE','REJETE'])))
              .order_by('-total')
        )

        # Par wilaya
        par_wilaya = list(
            qs.exclude(wilaya='').values('wilaya')
              .annotate(total=Count('id'))
              .order_by('-total')[:15]
        )

        # Par mois (12 derniers mois)
        par_mois = []
        for i in range(11, -1, -1):
            d = today - timedelta(days=30*i)
            count = qs.filter(
                date_soumission__year=d.year,
                date_soumission__month=d.month
            ).count()
            par_mois.append({
                'mois': d.strftime('%b %Y'),
                'annee': d.year,
                'mois_num': d.month,
                'count': count,
            })

        # Par statut
        par_statut = list(qs.values('statut').annotate(count=Count('id')).order_by('-count'))

        # Dernières demandes
        recentes = DemandeListSerializer(
            qs.order_by('-date_soumission')[:10], many=True
        ).data

        # ── Données renouvellement ────────────────────────────
        from api.models import RenouvellementDetail
        renouvellements = RenouvellementDetail.objects.select_related('demande__demandeur','demande__type_demande')

        renouv_data = []
        for r in renouvellements[:50]:
            renouv_data.append({
                'id':                    r.id,
                'numero_ref':            r.demande.numero_ref,
                'raison_sociale':        r.demande.raison_sociale,
                'statut_demande':        r.demande.statut,
                'wilaya':                r.demande.wilaya,
                'activite':              r.demande.activite,
                'date_soumission':       r.demande.date_soumission.strftime('%d/%m/%Y'),
                # Section I
                'abreviation':           r.abreviation,
                'nationalite_entreprise':r.nationalite_entreprise,
                # Section III
                'nom_responsable':       r.nom_responsable,
                'nni_passeport':         r.nni_passeport,
                'telephone_responsable': r.telephone_responsable,
                # Section IV
                'forme_juridique':       r.forme_juridique,
                'registre_commerce':     r.registre_commerce,
                'nif_numero':            r.nif_numero,
                'cnss_numero':           r.cnss_numero,
                # Section V
                'numero_enregistrement': r.numero_enregistrement,
                'date_creation':         str(r.date_creation) if r.date_creation else '',
                'date_debut_production': str(r.date_debut_production) if r.date_debut_production else '',
                'emplois_crees':         r.emplois_crees,
                'employes_administratifs':r.employes_administratifs,
                'techniciens':           r.techniciens,
                'ouvriers':              r.ouvriers,
                # Section VI
                'description_unite':     r.description_unite,
                'capital_social':        str(r.capital_social) if r.capital_social else '',
                'capacite_tonnes_an':    r.capacite_tonnes_an,
                'capacite_tonnes_jour':  r.capacite_tonnes_jour,
                'varietes_production':   r.varietes_production,
                'difficultes':           r.difficultes,
            })

        # Stats renouvellement
        renouv_stats = {
            'total':       renouvellements.count(),
            'par_forme':   list(renouvellements.values('forme_juridique').annotate(count=Count('id'))),
            'total_emplois': sum(r.emplois_crees for r in renouvellements),
        }

        return Response({
            'kpis':            kpis,
            'par_type':        par_type,
            'par_wilaya':      par_wilaya,
            'par_mois':        par_mois,
            'par_statut':      par_statut,
            'demandes_recentes': recentes,
            'renouvellements': renouv_data,
            'renouv_stats':    renouv_stats,
        })


class ExportView(generics.GenericAPIView):
    """
    GET /api/export/renouvellements/?format=csv|excel
    Export CSV ou Excel des données de renouvellement pour le DGI.
    """
    permission_classes = [IsAgentInstitutionnel]

    def get(self, request):
        import csv
        import io
        from django.http import HttpResponse
        from api.models import RenouvellementDetail

        fmt = request.query_params.get('format', 'csv')
        qs  = RenouvellementDetail.objects.select_related(
            'demande', 'demande__demandeur', 'demande__type_demande'
        ).order_by('-demande__date_soumission')

        # Filtres optionnels
        wilaya = request.query_params.get('wilaya')
        statut = request.query_params.get('statut')
        annee  = request.query_params.get('annee')
        if wilaya: qs = qs.filter(demande__wilaya=wilaya)
        if statut: qs = qs.filter(demande__statut=statut)
        if annee:  qs = qs.filter(demande__date_soumission__year=annee)

        HEADERS = [
            'N° Référence','Raison Sociale','Activité','Wilaya','Statut','Date Soumission',
            'Abréviation','Nationalité Entreprise',
            'Nom Responsable','NNI/Passeport','Tél Responsable',
            'Forme Juridique','N° RC','NIF','CNSS',
            'N° Enregistrement','Date Création','Date Début Production','Date Démarrage',
            'Emplois Créés','Employés Admin','Techniciens','Ouvriers','Total Employés',
            'Nationalités Employés',
            'Description Unité','Capital Social (MRU)','Fonds Propres','Emprunt',
            'Nature Investissement','Type Données',
            'Capacité (T/jour)','Capacité (T/mois)','Capacité (T/an)',
            'Production Effective','Stock',
            'Variétés Production','Capacité Estimée','Capacité Augmentation',
            'Difficultés',
        ]

        def row(r):
            total_emp = (r.employes_administratifs or 0) + (r.techniciens or 0) + (r.ouvriers or 0)
            return [
                r.demande.numero_ref,
                r.demande.raison_sociale,
                r.demande.activite,
                r.demande.wilaya,
                r.demande.get_statut_display(),
                r.demande.date_soumission.strftime('%d/%m/%Y'),
                r.abreviation,
                r.nationalite_entreprise,
                r.nom_responsable,
                r.nni_passeport,
                r.telephone_responsable,
                r.get_forme_juridique_display() if r.forme_juridique else '',
                r.registre_commerce,
                r.nif_numero,
                r.cnss_numero,
                r.numero_enregistrement,
                str(r.date_creation) if r.date_creation else '',
                str(r.date_debut_production) if r.date_debut_production else '',
                str(r.date_demarrage) if r.date_demarrage else '',
                r.emplois_crees,
                r.employes_administratifs,
                r.techniciens,
                r.ouvriers,
                total_emp,
                r.nationalites_employes,
                r.description_unite,
                str(r.capital_social or ''),
                str(r.fonds_propres or ''),
                str(r.emprunt or ''),
                r.nature_investissement,
                r.type_donnees,
                r.capacite_tonnes_jour,
                r.capacite_tonnes_mois,
                r.capacite_tonnes_an,
                r.production_effective,
                r.stock,
                r.varietes_production,
                r.capacite_augmentation,
                ' | '.join(r.difficultes) if isinstance(r.difficultes, list) else str(r.difficultes),
            ]

        if fmt == 'csv':
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = 'attachment; filename="renouvellements_mmi.csv"'
            writer = csv.writer(response)
            writer.writerow(HEADERS)
            for r in qs:
                writer.writerow(row(r))
            return response

        elif fmt == 'excel':
            try:
                import openpyxl
                from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
                from openpyxl.utils import get_column_letter

                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "Renouvellements MMI"

                # En-tête entreprise
                ws.merge_cells('A1:AK1')
                ws['A1'] = "MINISTÈRE DES MINES ET DE L'INDUSTRIE — Export Renouvellements Industriels"
                ws['A1'].font = Font(bold=True, size=13, color='FFFFFF')
                ws['A1'].fill = PatternFill('solid', fgColor='1B6B30')
                ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
                ws.row_dimensions[1].height = 30

                # En-têtes colonnes
                header_fill = PatternFill('solid', fgColor='2E8B45')
                header_font = Font(bold=True, color='FFFFFF', size=10)
                for col_idx, h in enumerate(HEADERS, 1):
                    cell = ws.cell(row=2, column=col_idx, value=h)
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = Alignment(horizontal='center', wrap_text=True)
                    ws.column_dimensions[get_column_letter(col_idx)].width = max(12, len(h) + 2)
                ws.row_dimensions[2].height = 40

                # Données
                alt_fill = PatternFill('solid', fgColor='F0FFF4')
                for row_idx, r in enumerate(qs, 3):
                    for col_idx, val in enumerate(row(r), 1):
                        cell = ws.cell(row=row_idx, column=col_idx, value=val)
                        cell.alignment = Alignment(wrap_text=True, vertical='top')
                        if row_idx % 2 == 0:
                            cell.fill = alt_fill

                # Figer la première ligne
                ws.freeze_panes = 'A3'

                # Filtre automatique
                ws.auto_filter.ref = f"A2:{get_column_letter(len(HEADERS))}2"

                buf = io.BytesIO()
                wb.save(buf)
                buf.seek(0)
                response = HttpResponse(
                    buf.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="renouvellements_mmi.xlsx"'
                return response
            except ImportError:
                return Response({'detail': 'openpyxl non installé. Utilisez format=csv'}, status=501)

        return Response({'detail': 'Format invalide. Utilisez format=csv ou format=excel'}, status=400)