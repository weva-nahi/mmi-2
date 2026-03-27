from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
import random, string


def generate_identifiant():
    chiffres = ''.join(random.choices(string.digits, k=5))
    return f"MMI-DEM-{chiffres}"

def generate_numero_ref():
    from datetime import date
    year   = date.today().year
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"MMI-{year}-{suffix}"


# ══════════════════════════════════════════════════════════════
# ACCOUNTS
# ══════════════════════════════════════════════════════════════

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email obligatoire")
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_super_admin', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # Identité
    nom                = models.CharField(max_length=100)
    prenom             = models.CharField(max_length=100, blank=True, default='')
    email              = models.EmailField(max_length=255, unique=True)
    email_recuperation = models.EmailField(max_length=255, blank=True, default='')
    telephone          = models.CharField(max_length=20, blank=True, default='')
    identifiant_unique = models.CharField(max_length=20, unique=True, blank=True, default='')

    # Entreprise (demandeurs)
    nom_entreprise  = models.CharField(max_length=255, blank=True, default='')
    forme_juridique = models.CharField(max_length=20, blank=True, default='',
        choices=[('etablissement','Établissement'),('sa','SA'),('sarl','SARL'),('autre','Autre')])
    nif             = models.CharField(max_length=50, blank=True, default='')
    adresse_siege   = models.TextField(blank=True, default='')

    # Flags
    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    is_super_admin = models.BooleanField(default=False)

    # Traçabilité
    created_by  = models.ForeignKey('self', null=True, blank=True,
                                     on_delete=models.SET_NULL,
                                     related_name='users_crees')
    created_at    = models.DateTimeField(default=timezone.now)
    last_login_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom']
    objects = UserManager()

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.nom_complet} <{self.email}>"

    def save(self, *args, **kwargs):
        if not self.identifiant_unique:
            uid = generate_identifiant()
            while User.objects.filter(identifiant_unique=uid).exists():
                uid = generate_identifiant()
            self.identifiant_unique = uid
        super().save(*args, **kwargs)

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}".strip()

    def has_role(self, code):
        return self.user_roles.filter(role__code=code, actif=True).exists()

    def get_roles(self):
        return list(self.user_roles.filter(actif=True).values_list('role__code', flat=True))


class Role(models.Model):
    CODES = [
        ('SUPER_ADMIN','Super Administrateur'),('DEMANDEUR','Demandeur'),
        ('SEC_CENTRAL','Agent Secrétariat Central'),('SEC_GENERAL','Secrétaire Général'),
        ('MINISTRE','Ministre MMI'),('DGI_DIRECTEUR','Directeur DGI'),
        ('DGI_SECRETARIAT','Secrétariat DGI'),('DDPI_CHEF','Chef Service DDPI'),
        ('DDPI_AGENT','Agent DDPI'),('MMI_SIGNATAIRE','Signataire MMI'),
    ]
    code        = models.CharField(max_length=50, unique=True, choices=CODES)
    nom         = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    niveau      = models.IntegerField(default=10)

    class Meta:
        db_table = 'role'
        ordering = ['niveau']

    def __str__(self):
        return f"{self.code} — {self.nom}"


class UserRole(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role        = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='roles_attribues')
    assigned_at = models.DateTimeField(default=timezone.now)
    actif       = models.BooleanField(default=True)

    class Meta:
        db_table        = 'user_role'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.nom_complet} -> {self.role.code}"


# ══════════════════════════════════════════════════════════════
# PORTAIL PUBLIC
# ══════════════════════════════════════════════════════════════

class Actualite(models.Model):
    titre            = models.CharField(max_length=255)
    titre_en         = models.CharField(max_length=300, blank=True, default='')
    titre_ar         = models.CharField(max_length=300, blank=True, default='')
    slug             = models.SlugField(max_length=255, unique=True, blank=True)
    contenu          = models.TextField()
    contenu_en       = models.TextField(blank=True, default='')
    contenu_ar       = models.TextField(blank=True, default='')
    image            = models.ImageField(upload_to='actualites/', blank=True, null=True)
    publie           = models.BooleanField(default=False)
    auteur           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                          related_name='actualites')
    date_publication = models.DateTimeField(default=timezone.now)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'actualite'
        ordering = ['-date_publication']

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.titre); slug = base; n = 1
            while Actualite.objects.filter(slug=slug).exists():
                slug = f"{base}-{n}"; n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class DocumentPublic(models.Model):
    CATEGORIES = [('JURIDIQUE','Document juridique'),('PROJET','Banque des projets'),('ANNEXE','Document annexe')]
    LANGUES    = [('fr','Français'),('en','Anglais'),('ar','Arabe')]

    titre       = models.CharField(max_length=300)
    titre_en    = models.CharField(max_length=300, blank=True, default='')
    titre_ar    = models.CharField(max_length=300, blank=True, default='')
    categorie   = models.CharField(max_length=20, choices=CATEGORIES)
    fichier     = models.FileField(upload_to='documents_publics/')
    langue      = models.CharField(max_length=5, choices=LANGUES, default='fr')
    description = models.TextField(blank=True, default='')
    publie      = models.BooleanField(default=False)
    ordre       = models.IntegerField(default=0)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                     related_name='documents_publics')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_public'
        ordering = ['categorie','ordre','-created_at']

    def __str__(self):
        return f"[{self.categorie}] {self.titre}"


class ProjetBanque(models.Model):
    STATUTS = [('ouvert','Ouvert'),('en_cours','En cours'),('cloture','Clôturé')]

    titre         = models.CharField(max_length=300)
    secteur       = models.CharField(max_length=100)
    description   = models.TextField()
    budget_estime = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    statut        = models.CharField(max_length=20, choices=STATUTS, default='ouvert')
    fichier       = models.FileField(upload_to='projets/', blank=True, null=True)
    publie        = models.BooleanField(default=False)
    created_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                       related_name='projets')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projet_banque'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre} — {self.secteur}"


# ══════════════════════════════════════════════════════════════
# DEMANDES
# ══════════════════════════════════════════════════════════════

class TypeDemande(models.Model):
    CODES = [
        ('BP',"Autorisation Boulangerie / Pâtisserie"),
        ('USINE_EAU',"Autorisation Unité Eau Minérale"),
        ('UNITE',"Autorisation Unité Industrielle"),
        ('RENOUVELLEMENT',"Renouvellement d'Enregistrement"),
        ('EXTENSION',"Demande d'Extension"),
    ]
    code        = models.CharField(max_length=30, unique=True, choices=CODES)
    libelle     = models.CharField(max_length=200)
    libelle_en  = models.CharField(max_length=200, blank=True, default='')
    libelle_ar  = models.CharField(max_length=200, blank=True, default='')
    description = models.TextField(blank=True, default='')
    actif       = models.BooleanField(default=True)

    class Meta:
        db_table = 'type_demande'

    def __str__(self):
        return f"{self.code} — {self.libelle}"


class Demande(models.Model):
    STATUTS = [
        ('SOUMISE','Soumise'),('EN_RECEPTION','En réception SC'),
        ('TRANSMISE_SG','Transmise SG'),('EN_LECTURE_SG','En lecture SG'),
        ('TRANSMISE_MINISTRE','Transmise Ministre'),('EN_LECTURE_MINISTRE','En lecture Ministre'),
        ('EN_INSTRUCTION_DGI','En instruction DGI'),('EN_TRAITEMENT_DDPI','En traitement DDPI'),
        ('DOSSIER_INCOMPLET','Dossier incomplet'),('VISITE_PROGRAMMEE','Visite programmée'),
        ('EN_COMMISSION_BP','En commission BP'),('ACCORD_PRINCIPE','Accord de principe'),
        ('ARRETE_EN_COURS','Arrêté en rédaction'),('SIGNATURE_DGI','Signature DGI'),
        ('SIGNATURE_MMI','Signature MMI'),('VALIDE','Validée'),('REJETE','Rejetée'),
    ]

    numero_ref          = models.CharField(max_length=30, unique=True, blank=True, default='')
    demandeur           = models.ForeignKey(User, on_delete=models.PROTECT, related_name='demandes')
    type_demande        = models.ForeignKey(TypeDemande, on_delete=models.PROTECT)
    gestionnaire        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='dossiers_geres')
    statut              = models.CharField(max_length=50, choices=STATUTS, default='SOUMISE')
    raison_sociale      = models.CharField(max_length=255)
    activite            = models.CharField(max_length=255)
    adresse             = models.TextField()
    wilaya              = models.CharField(max_length=100)
    latitude            = models.FloatField(null=True, blank=True)
    longitude           = models.FloatField(null=True, blank=True)
    autorisation_parent = models.ForeignKey('Autorisation', on_delete=models.SET_NULL,
                                             null=True, blank=True,
                                             related_name='demandes_extension')
    date_soumission     = models.DateTimeField(default=timezone.now)
    date_maj            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'demande'
        ordering = ['-date_soumission']

    def __str__(self):
        return f"{self.numero_ref} — {self.raison_sociale} [{self.statut}]"

    def save(self, *args, **kwargs):
        if not self.numero_ref:
            ref = generate_numero_ref()
            while Demande.objects.filter(numero_ref=ref).exists():
                ref = generate_numero_ref()
            self.numero_ref = ref
        super().save(*args, **kwargs)


class EtapeTraitement(models.Model):
    CODES_ETAPES = [
        ('SC_RECEPTION','Accusé réception'),('SC_TRANSMISSION_SG','Transmission SG'),
        ('SG_LECTURE','Lecture SG'),('SG_TRANSMISSION_MIN','Transmission Ministre'),
        ('SG_TRANSMISSION_DGI','Transmission directe DGI'),('MIN_LECTURE','Lecture Ministre'),
        ('MIN_TRANSMISSION_DGI','Transmission DGI par Ministre'),('DGI_INSTRUCTION','Instruction DGI'),
        ('DGI_TRANSMISSION_DDPI','Transmission DDPI'),('DGI_SIGNATURE','Signature DGI'),
        ('DDPI_VERIFICATION','Vérification complétude'),('DDPI_INCOMPLET','Dossier incomplet'),
        ('DDPI_VISITE','Visite programmée'),('DDPI_PV_VISITE','PV de visite'),
        ('DDPI_COMMISSION_BP','Commission BP'),('DDPI_ACCORD_PRINCIPE','Accord de principe'),
        ('DDPI_REJET','Rejet'),('DDPI_CHEF_SERVICE','Transmission Chef service'),
        ('MMI_SIGNATURE','Signature MMI'),('SYSTEME_VALIDATION','Validation système'),
    ]

    demande      = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='etapes')
    acteur       = models.ForeignKey(User, on_delete=models.PROTECT, related_name='etapes_effectuees')
    etape_code   = models.CharField(max_length=60, choices=CODES_ETAPES)
    statut_avant = models.CharField(max_length=50)
    statut_apres = models.CharField(max_length=50)
    action       = models.CharField(max_length=200)
    commentaire  = models.TextField(blank=True, default='')
    date_action  = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'etape_traitement'
        ordering = ['date_action']

    def __str__(self):
        return f"{self.demande.numero_ref} — {self.etape_code}"


class PieceRequise(models.Model):
    FORMATS = [
        ('.pdf',            'PDF uniquement'),
        ('.pdf,.jpg,.png',  'PDF, JPG, PNG'),
        ('.pdf,.doc,.docx', 'PDF, DOC, DOCX'),
        ('*',               'Tous formats'),
    ]
    type_demande       = models.ForeignKey(TypeDemande, on_delete=models.CASCADE,
                                            related_name='pieces_requises')
    nom                = models.CharField(max_length=200)
    nom_en             = models.CharField(max_length=200, blank=True, default='')
    nom_ar             = models.CharField(max_length=200, blank=True, default='')
    description        = models.TextField(blank=True, default='')
    obligatoire        = models.BooleanField(default=True)
    has_statut         = models.BooleanField(default=False)
    has_cahier_charges = models.BooleanField(default=False)
    ordre              = models.IntegerField(default=0)
    format_accepte     = models.CharField(max_length=50, default='.pdf,.jpg,.png', choices=FORMATS)

    class Meta:
        db_table = 'piece_requise'
        ordering = ['type_demande','ordre']

    def __str__(self):
        return f"{self.type_demande.code} — {self.nom}"


class PieceJointe(models.Model):
    STATUTS = [('en_attente','En attente'),('valide','Validée'),('invalide','Invalidée')]

    demande       = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='pieces_jointes')
    piece_requise = models.ForeignKey(PieceRequise, on_delete=models.PROTECT, null=True, blank=True)
    nom_original  = models.CharField(max_length=255)
    fichier       = models.FileField(upload_to='pieces_jointes/%Y/%m/')
    taille_ko     = models.IntegerField(null=True, blank=True)
    statut        = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    motif_rejet   = models.TextField(blank=True, default='')
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'piece_jointe'

    def __str__(self):
        return f"{self.demande.numero_ref} — {self.nom_original}"


class Notification(models.Model):
    TYPES = [
        ('statut_change','Changement statut'),('document_pret','Document disponible'),
        ('action_requise','Action requise'),('dossier_incomplet','Dossier incomplet'),
        ('rejet','Rejetée'),('validation','Validée'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    demande    = models.ForeignKey(Demande, on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='notifications')
    type       = models.CharField(max_length=30, choices=TYPES)
    titre      = models.CharField(max_length=200)
    message    = models.TextField()
    lu         = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.nom_complet} — {self.titre}"


# ══════════════════════════════════════════════════════════════
# AUTORISATIONS
# ══════════════════════════════════════════════════════════════

class Autorisation(models.Model):
    TYPES   = [('BP','BP'),('USINE_EAU','Eau Minérale'),('UNITE','Unité Industrielle'),
               ('RENOUVELLEMENT','Renouvellement'),('EXTENSION','Extension')]
    STATUTS = [('active','Active'),('suspendue','Suspendue'),('expiree','Expirée'),('revoquee','Révoquée')]

    demande         = models.OneToOneField(Demande, on_delete=models.PROTECT, related_name='autorisation')
    numero_auto     = models.CharField(max_length=80, unique=True)
    type            = models.CharField(max_length=20, choices=TYPES)
    statut          = models.CharField(max_length=20, choices=STATUTS, default='active')
    latitude        = models.FloatField(null=True, blank=True)
    longitude       = models.FloatField(null=True, blank=True)
    wilaya          = models.CharField(max_length=100, blank=True, default='')
    adresse         = models.TextField(blank=True, default='')
    date_delivrance = models.DateField()
    date_expiration = models.DateField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'autorisation'
        ordering = ['-date_delivrance']

    def __str__(self):
        return f"{self.numero_auto} — {self.type} [{self.statut}]"


class DocumentGenere(models.Model):
    TYPES_DOC = [
        ('attestation',"Attestation"),('arrete_bp','Arrêté BP'),
        ('arrete_conjoint','Arrêté conjoint'),('arrete_unite','Arrêté unité'),
        ('certificat','Certificat renouvellement'),('accord_principe','Accord de principe'),
        ('lettre_rejet','Lettre de rejet'),('lettre_incomplet','Lettre dossier incomplet'),
    ]

    demande         = models.ForeignKey(Demande, on_delete=models.CASCADE, related_name='documents_generes')
    type_doc        = models.CharField(max_length=30, choices=TYPES_DOC)
    fichier_pdf     = models.FileField(upload_to='documents_officiels/%Y/%m/')
    signataire      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name='documents_signes')
    signataire_role = models.CharField(max_length=50, blank=True, default='')
    signe           = models.BooleanField(default=False)
    date_signature  = models.DateTimeField(null=True, blank=True)
    genere_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_genere'
        ordering = ['-genere_at']

    def __str__(self):
        return f"{self.demande.numero_ref} — {self.type_doc}"


# ══════════════════════════════════════════════════════════════
# MÉTIER SPÉCIFIQUE
# ══════════════════════════════════════════════════════════════

class VisiteLieux(models.Model):
    demande      = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='visite_lieux')
    inspecteur   = models.ForeignKey(User, on_delete=models.PROTECT, related_name='visites_effectuees')
    date_visite  = models.DateField()
    rapport      = models.FileField(upload_to='visites/rapports/', blank=True, null=True)
    pv_visite    = models.FileField(upload_to='visites/pv/', blank=True, null=True)
    observations = models.TextField(blank=True, default='')
    conforme     = models.BooleanField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visite_lieux'

    def __str__(self):
        return f"Visite {self.demande.numero_ref} — {self.date_visite}"


class ComiteBP(models.Model):
    DECISIONS = [('accord','Accord'),('rejet','Rejet')]

    demande      = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='comite_bp')
    date_reunion = models.DateField()
    pv_reunion   = models.FileField(upload_to='comite_bp/pv/', blank=True, null=True)
    quittance    = models.FileField(upload_to='comite_bp/quittances/', blank=True, null=True)
    decision     = models.CharField(max_length=10, choices=DECISIONS, blank=True, default='')
    motif_rejet  = models.TextField(blank=True, default='')
    membres      = models.JSONField(default=list, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comite_bp'

    def __str__(self):
        return f"Comité BP — {self.demande.numero_ref}"


class DistanceBoulangerie(models.Model):
    demande         = models.OneToOneField(Demande, on_delete=models.CASCADE,
                                            related_name='distance_boulangerie')
    distance_metres = models.FloatField()
    conforme_500m   = models.BooleanField()
    reference_auto  = models.CharField(max_length=80, blank=True, default='')
    latitude_ref    = models.FloatField(null=True, blank=True)
    longitude_ref   = models.FloatField(null=True, blank=True)
    calcule_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'distance_boulangerie'

    def __str__(self):
        s = 'OK' if self.conforme_500m else 'NON CONFORME'
        return f"{self.demande.numero_ref} — {self.distance_metres}m ({s})"


class RenouvellementDetail(models.Model):
    FORMES  = [('etablissement','Établissement'),('sa','SA'),('sarl','SARL'),('autre','Autre')]
    NATURES = [('national','National'),('international','International'),('mixte','Mixte')]
    TYPES_D = [('nouvelle_creation','Nouvelle création'),('extension','Extension'),('modernisation','Modernisation')]

    demande = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='renouvellement_detail')

    # I
    abreviation            = models.CharField(max_length=50, blank=True, default='')
    nationalite_entreprise = models.CharField(max_length=100, blank=True, default='')
    # III
    nom_responsable         = models.CharField(max_length=200, blank=True, default='')
    nni_passeport           = models.CharField(max_length=50, blank=True, default='')
    nationalite_responsable = models.CharField(max_length=100, blank=True, default='')
    telephone_responsable   = models.CharField(max_length=20, blank=True, default='')
    # IV
    forme_juridique  = models.CharField(max_length=20, choices=FORMES, blank=True, default='')
    statuts_numero   = models.CharField(max_length=100, blank=True, default='')
    statuts_date     = models.DateField(null=True, blank=True)
    registre_commerce = models.CharField(max_length=100, blank=True, default='')
    registre_date    = models.DateField(null=True, blank=True)
    nif_numero       = models.CharField(max_length=50, blank=True, default='')
    nif_date         = models.DateField(null=True, blank=True)
    cnss_numero      = models.CharField(max_length=50, blank=True, default='')
    # V
    numero_enregistrement   = models.CharField(max_length=80, blank=True, default='')
    date_creation           = models.DateField(null=True, blank=True)
    date_debut_production   = models.DateField(null=True, blank=True)
    date_demarrage          = models.DateField(null=True, blank=True)
    nombre_arrets           = models.IntegerField(default=0)
    emplois_crees           = models.IntegerField(default=0)
    nationalites_employes   = models.CharField(max_length=255, blank=True, default='')
    employes_administratifs = models.IntegerField(default=0)
    techniciens             = models.IntegerField(default=0)
    ouvriers                = models.IntegerField(default=0)
    # VI
    description_unite       = models.TextField(blank=True, default='')
    capital_social          = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    fonds_propres           = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    emprunt                 = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    nature_investissement   = models.CharField(max_length=20, choices=NATURES, blank=True, default='')
    type_donnees            = models.CharField(max_length=25, choices=TYPES_D, blank=True, default='')
    matieres_premieres_2023 = models.TextField(blank=True, default='')
    matieres_premieres_2024 = models.TextField(blank=True, default='')
    capacite_tonnes_jour    = models.FloatField(null=True, blank=True)
    capacite_tonnes_mois    = models.FloatField(null=True, blank=True)
    capacite_tonnes_an      = models.FloatField(null=True, blank=True)
    production_effective    = models.TextField(blank=True, default='')
    stock                   = models.TextField(blank=True, default='')
    varietes_production     = models.TextField(blank=True, default='')
    capacite_augmentation   = models.TextField(blank=True, default='')
    # VII — MySQL 5.7.8+ JSON natif
    difficultes = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'renouvellement_detail'

    def __str__(self):
        return f"Renouvellement — {self.demande.numero_ref}"


class ExtensionDetail(models.Model):
    TYPES_EXT = [('surface','Surface'),('capacite','Capacité'),
                 ('activite','Activité'),('equipement','Équipements')]

    demande                 = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='extension_detail')
    type_extension          = models.CharField(max_length=20, choices=TYPES_EXT)
    surface_actuelle        = models.FloatField(null=True, blank=True)
    surface_apres           = models.FloatField(null=True, blank=True)
    capacite_actuelle       = models.CharField(max_length=100, blank=True, default='')
    capacite_apres          = models.CharField(max_length=100, blank=True, default='')
    description             = models.TextField()
    justification           = models.TextField()
    investissement_mru      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    emplois_supplementaires = models.IntegerField(default=0)

    class Meta:
        db_table = 'extension_detail'

    def __str__(self):
        return f"Extension — {self.demande.numero_ref}"


class UsineEauDetail(models.Model):
    demande                      = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='usine_eau_detail')
    num_autorisation_eau         = models.CharField(max_length=100, blank=True, default='')
    date_autorisation_eau        = models.DateField(null=True, blank=True)
    laboratoire_analyse          = models.CharField(max_length=200, blank=True, default='')
    date_analyses                = models.DateField(null=True, blank=True)
    resultats_analyses           = models.TextField(blank=True, default='')
    debit_puits_m3_jour          = models.FloatField(null=True, blank=True)
    profondeur_forage_m          = models.FloatField(null=True, blank=True)
    type_emballage               = models.CharField(max_length=200, blank=True, default='')
    conditions_commercialisation = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'usine_eau_detail'

    def __str__(self):
        return f"Usine Eau — {self.demande.numero_ref}"


class UniteIndustrielleDetail(models.Model):
    demande             = models.OneToOneField(Demande, on_delete=models.CASCADE, related_name='unite_detail')
    description_unite   = models.TextField(blank=True, default='')
    capacite_production = models.CharField(max_length=100, blank=True, default='')
    capital_social      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    emplois_directs     = models.IntegerField(default=0)
    resume_tdr          = models.TextField(blank=True, default='')
    matieres_premieres  = models.TextField(blank=True, default='')
    statuts_numero      = models.CharField(max_length=100, blank=True, default='')
    statuts_date        = models.DateField(null=True, blank=True)
    rc_numero           = models.CharField(max_length=100, blank=True, default='')
    rc_date             = models.DateField(null=True, blank=True)
    nif_numero          = models.CharField(max_length=50, blank=True, default='')
    cnss_numero         = models.CharField(max_length=50, blank=True, default='')
    type_bail           = models.CharField(max_length=20, blank=True, default='',
                            choices=[('tf','Titre foncier'),('bail','Contrat de bail')])

    class Meta:
        db_table = 'unite_industrielle_detail'

    def __str__(self):
        return f"Unité industrielle — {self.demande.numero_ref}"


# ══════════════════════════════════════════════════════════════
# CONFIGURATION PLATEFORME (nom ministre, paramètres admin)
# ══════════════════════════════════════════════════════════════

class ConfigPlateforme(models.Model):
    """Paramètres globaux modifiables par le Super Admin."""
    cle         = models.CharField(max_length=100, unique=True)
    valeur      = models.TextField()
    description = models.CharField(max_length=255, blank=True, default='')
    updated_at  = models.DateTimeField(auto_now=True)
    updated_by  = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='configs_modifiees'
    )

    class Meta:
        db_table = 'config_plateforme'

    def __str__(self):
        return f"{self.cle} = {self.valeur[:50]}"

    @classmethod
    def get(cls, cle, defaut=''):
        try:
            return cls.objects.get(cle=cle).valeur
        except cls.DoesNotExist:
            return defaut