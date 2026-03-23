"""
Serializers DRF — MMI Platform
Couvre tous les endpoints de l'API.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Role, UserRole,
    Actualite, DocumentPublic, ProjetBanque,
    TypeDemande, Demande, EtapeTraitement, PieceRequise, PieceJointe, Notification,
    Autorisation, DocumentGenere,
    VisiteLieux, ComiteBP, DistanceBoulangerie,
    RenouvellementDetail, ExtensionDetail, UsineEauDetail, UniteIndustrielleDetail,
)


# ─────────────────────────────────────────────────────────────
# AUTHENTIFICATION
# ─────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login via identifiant_unique + password (pas email).
    """
    username_field = 'identifiant_unique'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['identifiant_unique'] = serializers.CharField()
        self.fields.pop('email', None)

    def validate(self, attrs):
        identifiant = attrs.get('identifiant_unique')
        password = attrs.get('password')
        try:
            user = User.objects.get(identifiant_unique=identifiant)
        except User.DoesNotExist:
            raise serializers.ValidationError("Identifiant ou mot de passe incorrect.")
        if not user.check_password(password):
            raise serializers.ValidationError("Identifiant ou mot de passe incorrect.")
        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé. Contactez l'administrateur.")
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
            'user': UserDetailSerializer(user).data,
        }


class InscriptionSerializer(serializers.ModelSerializer):
    """Inscription auto du demandeur."""
    password             = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm     = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'nom', 'prenom', 'email', 'email_recuperation', 'telephone',
            'nom_entreprise', 'forme_juridique', 'nif', 'adresse_siege',
            'password', 'password_confirm',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Attribuer le rôle DEMANDEUR
        role, _ = Role.objects.get_or_create(code='DEMANDEUR', defaults={'nom': 'Demandeur', 'niveau': 10})
        UserRole.objects.create(user=user, role=role)
        return user


# ─────────────────────────────────────────────────────────────
# UTILISATEURS & RÔLES
# ─────────────────────────────────────────────────────────────

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Role
        fields = ['id', 'code', 'nom', 'description', 'niveau']


class UserRoleSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    class Meta:
        model  = UserRole
        fields = ['id', 'role', 'assigned_at', 'actif']


class UserListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes."""
    roles = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'identifiant_unique', 'nom', 'prenom', 'email',
                  'nom_entreprise', 'is_active', 'created_at', 'roles']

    def get_roles(self, obj):
        return obj.get_roles()


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour le profil utilisateur."""
    roles      = serializers.SerializerMethodField()
    nom_complet = serializers.CharField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'identifiant_unique', 'nom', 'prenom', 'email',
            'email_recuperation', 'telephone', 'nom_complet',
            'nom_entreprise', 'forme_juridique', 'nif', 'adresse_siege',
            'is_active', 'is_super_admin', 'created_at', 'last_login_at', 'roles',
        ]

    def get_roles(self, obj):
        return obj.get_roles()


class UserCreateSerializer(serializers.ModelSerializer):
    """Création d'un agent par le Super Admin."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role_code = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['nom', 'prenom', 'email', 'telephone', 'password', 'role_code']

    def create(self, validated_data):
        role_code = validated_data.pop('role_code')
        password  = validated_data.pop('password')
        request   = self.context.get('request')
        user = User(**validated_data)
        user.set_password(password)
        if request:
            user.created_by = request.user
        user.save()
        role, _ = Role.objects.get_or_create(code=role_code, defaults={'nom': role_code})
        UserRole.objects.create(user=user, role=role, assigned_by=request.user if request else None)
        return user


# ─────────────────────────────────────────────────────────────
# PORTAIL PUBLIC
# ─────────────────────────────────────────────────────────────

class ActualiteSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.nom_complet', read_only=True)

    class Meta:
        model  = Actualite
        fields = ['id', 'titre', 'titre_en', 'titre_ar', 'slug', 'contenu',
                  'contenu_en', 'contenu_ar', 'image', 'publie',
                  'auteur_nom', 'date_publication', 'created_at']
        read_only_fields = ['slug', 'created_at']


class DocumentPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DocumentPublic
        fields = ['id', 'titre', 'titre_en', 'titre_ar', 'categorie',
                  'fichier', 'langue', 'description', 'publie', 'ordre', 'created_at']


class ProjetBanqueSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProjetBanque
        fields = ['id', 'titre', 'secteur', 'description', 'budget_estime',
                  'statut', 'fichier', 'publie', 'created_at']


# ─────────────────────────────────────────────────────────────
# DEMANDES
# ─────────────────────────────────────────────────────────────

class TypeDemandeSerializer(serializers.ModelSerializer):
    pieces_requises = serializers.SerializerMethodField()

    class Meta:
        model  = TypeDemande
        fields = ['id', 'code', 'libelle', 'libelle_en', 'libelle_ar',
                  'description', 'actif', 'pieces_requises']

    def get_pieces_requises(self, obj):
        return PieceRequiseSerializer(
            obj.pieces_requises.all(), many=True
        ).data


class PieceRequiseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PieceRequise
        fields = ['id', 'nom', 'nom_en', 'nom_ar', 'description',
                  'obligatoire', 'has_statut', 'has_cahier_charges', 'ordre']


class PieceJointeSerializer(serializers.ModelSerializer):
    piece_requise_nom = serializers.CharField(source='piece_requise.nom', read_only=True)

    class Meta:
        model  = PieceJointe
        fields = ['id', 'piece_requise', 'piece_requise_nom', 'nom_original',
                  'fichier', 'taille_ko', 'statut', 'motif_rejet', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class EtapeTraitementSerializer(serializers.ModelSerializer):
    acteur_nom = serializers.CharField(source='acteur.nom_complet', read_only=True)
    acteur_role = serializers.SerializerMethodField()

    class Meta:
        model  = EtapeTraitement
        fields = ['id', 'etape_code', 'statut_avant', 'statut_apres',
                  'action', 'commentaire', 'date_action', 'acteur_nom', 'acteur_role']

    def get_acteur_role(self, obj):
        return obj.acteur.get_roles()


class DemandeListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes de demandes."""
    type_code    = serializers.CharField(source='type_demande.code', read_only=True)
    type_libelle = serializers.CharField(source='type_demande.libelle', read_only=True)
    demandeur_nom = serializers.CharField(source='demandeur.nom_complet', read_only=True)

    class Meta:
        model  = Demande
        fields = ['id', 'numero_ref', 'statut', 'raison_sociale', 'wilaya',
                  'type_code', 'type_libelle', 'demandeur_nom',
                  'date_soumission', 'date_maj']


class DemandeDetailSerializer(serializers.ModelSerializer):
    """Serializer complet avec toutes les données imbriquées."""
    type_demande    = TypeDemandeSerializer(read_only=True)
    type_demande_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeDemande.objects.all(), source='type_demande', write_only=True
    )
    demandeur       = UserListSerializer(read_only=True)
    pieces_jointes  = PieceJointeSerializer(many=True, read_only=True)
    etapes          = EtapeTraitementSerializer(many=True, read_only=True)
    autorisation    = serializers.SerializerMethodField()

    class Meta:
        model  = Demande
        fields = [
            'id', 'numero_ref', 'statut',
            'raison_sociale', 'activite', 'adresse', 'wilaya',
            'latitude', 'longitude',
            'type_demande', 'type_demande_id',
            'demandeur', 'gestionnaire',
            'autorisation_parent',
            'pieces_jointes', 'etapes', 'autorisation',
            'date_soumission', 'date_maj',
        ]
        read_only_fields = ['numero_ref', 'statut', 'date_soumission', 'date_maj']

    def get_autorisation(self, obj):
        try:
            return AutorisationSerializer(obj.autorisation).data
        except Autorisation.DoesNotExist:
            return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['demandeur'] = request.user
        return super().create(validated_data)


class TransitionStatutSerializer(serializers.Serializer):
    """Serializer pour les transitions de statut (transmissions, signatures…)."""
    etape_code  = serializers.ChoiceField(choices=EtapeTraitement.CODES_ETAPES)
    commentaire = serializers.CharField(required=False, allow_blank=True)
    action      = serializers.CharField(max_length=200)


class NotificationSerializer(serializers.ModelSerializer):
    demande_ref = serializers.CharField(source='demande.numero_ref', read_only=True)

    class Meta:
        model  = Notification
        fields = ['id', 'type', 'titre', 'message', 'lu', 'created_at', 'demande_ref']


# ─────────────────────────────────────────────────────────────
# AUTORISATIONS
# ─────────────────────────────────────────────────────────────

class AutorisationSerializer(serializers.ModelSerializer):
    demande_ref = serializers.CharField(source='demande.numero_ref', read_only=True)

    class Meta:
        model  = Autorisation
        fields = ['id', 'numero_auto', 'type', 'statut',
                  'latitude', 'longitude', 'wilaya', 'adresse',
                  'date_delivrance', 'date_expiration',
                  'demande_ref', 'created_at']


class AutorisationGeoJSONSerializer(serializers.ModelSerializer):
    """Format GeoJSON pour la carte Leaflet publique."""
    class Meta:
        model  = Autorisation
        fields = ['id', 'numero_auto', 'type', 'statut',
                  'latitude', 'longitude', 'wilaya', 'adresse',
                  'date_delivrance']


class DocumentGenereSerializer(serializers.ModelSerializer):
    signataire_nom = serializers.CharField(source='signataire.nom_complet', read_only=True)
    demande_ref    = serializers.CharField(source='demande.numero_ref', read_only=True)

    class Meta:
        model  = DocumentGenere
        fields = ['id', 'type_doc', 'fichier_pdf', 'signe',
                  'date_signature', 'signataire_nom', 'demande_ref', 'genere_at']


# ─────────────────────────────────────────────────────────────
# DÉTAILS MÉTIER
# ─────────────────────────────────────────────────────────────

class VisiteLieuxSerializer(serializers.ModelSerializer):
    inspecteur_nom = serializers.CharField(source='inspecteur.nom_complet', read_only=True)

    class Meta:
        model  = VisiteLieux
        fields = ['id', 'demande', 'date_visite', 'rapport', 'pv_visite',
                  'observations', 'conforme', 'inspecteur_nom', 'created_at']


class ComiteBPSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ComiteBP
        fields = ['id', 'demande', 'date_reunion', 'pv_reunion', 'quittance',
                  'decision', 'motif_rejet', 'membres', 'created_at']


class DistanceBoulangerieSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DistanceBoulangerie
        fields = ['id', 'demande', 'distance_metres', 'conforme_500m',
                  'reference_auto', 'latitude_ref', 'longitude_ref', 'calcule_at']


class RenouvellementDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RenouvellementDetail
        exclude = ['id']


class ExtensionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExtensionDetail
        exclude = ['id']


class UsineEauDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UsineEauDetail
        exclude = ['id']


class UniteIndustrielleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UniteIndustrielleDetail
        exclude = ['id']
