"""
Script d'initialisation de la base de données MMI.
Lance depuis le dossier mmi_backend : python setup_db.py
"""
import os, sys, django

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mmi_project.settings')
django.setup()

from api.models import TypeDemande, PieceRequise, Role

print("\n=== Initialisation base de données MMI ===\n")

# ── Rôles ─────────────────────────────────────────────────────
ROLES = [
    ('SUPER_ADMIN',      'Super Administrateur',                    1),
    ('DEMANDEUR',        'Demandeur',                              10),
    ('SEC_CENTRAL',      'Agent Secretariat Central',              20),
    ('SEC_GENERAL',      'Secretaire General',                     30),
    ('MINISTRE',         'Ministre MMI - Signataire',              40),
    ('DGI_DIRECTEUR',    'Directeur General de l Industrie',       50),
    ('DGI_SECRETARIAT',  'Secretariat DGI',                        51),
    ('DDPI_DIRECTEUR',   'Directeur DDPI',                         60),
    ('DDPI_CHEF_BP',     'Chef Service Boulangeries Patisseries',  61),
    ('DDPI_CHEF_USINES', 'Chef Service Usines Industrielles',      62),
    ('DDPI_AGENT',       'Agent DDPI',                             63),
    ('SEC_COMITE_BP',    'Secretaire du Comite BP',                64),
    ('MMI_SIGNATAIRE',   'Signataire MMI',                         70),
]
print("1. Création des rôles...")
for code, nom, niveau in ROLES:
    _, created = Role.objects.get_or_create(code=code, defaults={'nom': nom, 'niveau': niveau})
    print(f"   {'✅' if created else '⏩'} {code}")

# ── Types de demande + Pièces requises ────────────────────────
# Tuple : (nom, obligatoire, format_accepte, ordre)
TYPES = [
    {
        'code': 'BP', 'libelle': "Autorisation Boulangerie / Pâtisserie",
        'description': "Autorisation d'ouverture d'une boulangerie ou pâtisserie",
        'pieces': [
            ('Statut certifié par le notaire',                                   True,  '.pdf,.jpg,.png', 1),
            ('Registre de commerce local',                                        True,  '.pdf,.jpg,.png', 2),
            ("Numéro d'identification fiscale (NIF)",                             True,  '.pdf,.jpg,.png', 3),
            ("Certificat d'enregistrement CNSS",                                  True,  '.pdf,.jpg,.png', 4),
            ("Demande adressée au Ministre chargé de l'Industrie",               True,  '.pdf',            5),
            ("Copie CIN et téléphone du propriétaire",                           True,  '.pdf,.jpg,.png', 6),
            ("Titre de propriété ou contrat de bail (min 5 ans)",                True,  '.pdf',            7),
            ("Étude de faisabilité économique",                                   True,  '.pdf',            8),
            ("Copie du cahier des charges signée par l'intéressé",               True,  '.pdf',            9),
        ]
    },
    {
        'code': 'USINE_EAU', 'libelle': "Autorisation Unité Eau Minérale",
        'description': "Autorisation de production d'eau minérale embouteillée",
        'pieces': [
            ('Statut certifié par le notaire',                                   True,  '.pdf,.jpg,.png', 1),
            ('Registre de commerce local',                                        True,  '.pdf,.jpg,.png', 2),
            ("NIF (Numéro d'Identification Fiscale)",                             True,  '.pdf,.jpg,.png', 3),
            ("Certificat d'enregistrement CNSS",                                  True,  '.pdf,.jpg,.png', 4),
            ("Autorisation du Ministère de l'Eau (MHA) pour le forage",          True,  '.pdf,.jpg,.png', 5),
            ("Analyses des échantillons d'eau (laboratoire agréé)",              True,  '.pdf',            6),
            ("Étude de faisabilité du projet",                                    True,  '.pdf',            7),
            ("Déclaration de conformité de l'emballage (MMI + Santé)",           True,  '.pdf',            8),
            ("Copie du cahier des charges signé",                                 True,  '.pdf',            9),
            ("Demande d'autorisation adressée au Ministre",                       True,  '.pdf',           10),
            ("Copie d'identité du propriétaire",                                  True,  '.pdf,.jpg,.png',11),
            ("Titre de propriété foncière du terrain",                            True,  '.pdf,.jpg,.png',12),
            ("Titre de propriété foncière ou bail du terrain",                    True,  '.pdf,.jpg,.png',12),
        ]
    },
    {
        'code': 'UNITE', 'libelle': "Autorisation Unité Industrielle",
        'description': "Autorisation d'ouverture d'une unité de production industrielle",
        'pieces': [
            ('Statut juridique',                                                  True,  '.pdf,.jpg,.png', 1),
            ('Registre de commerce',                                              True,  '.pdf,.jpg,.png', 2),
            ('NIF',                                                               True,  '.pdf,.jpg,.png', 3),
            ("Certificat d'enregistrement CNSS",                                  True,  '.pdf,.jpg,.png', 4),
            ("Demande adressée au Ministre de l'Industrie",                       True,  '.pdf',            5),
            ("Étude de faisabilité",                                              True,  '.pdf',            6),
            ("TDR — Termes de référence pour l'étude d'impact environnemental",  True,  '.pdf',            7),
            ("Coordonnées GPS (document ou capture)",                             True,  '.pdf,.jpg,.png', 8),
            ("Fiches techniques des équipements",                                 True,  '.pdf',            9),
            ("Titre foncier ou contrat de bail",                                  True,  '.pdf,.jpg,.png',10),
            ("Cahier des charges signé",                                          True,  '.pdf',           11),
        ]
    },
    {
        'code': 'RENOUVELLEMENT', 'libelle': "Renouvellement d'Enregistrement",
        'description': "Renouvellement d'enregistrement industriel MMI 2025",
        'pieces': [
            ('Registre de commerce (RCCM)',                                       True,  '.pdf,.jpg,.png', 1),
            ('Attestation NIF',                                                   True,  '.pdf,.jpg,.png', 2),
            ("Ancien numéro d'enregistrement / autorisation",                     True,  '.pdf,.jpg,.png', 3),
            ('Bilan comptable 2023/2024',                                         False, '.pdf',            4),
            ("Attestation de régularité CNSS",                                    False, '.pdf,.jpg,.png', 5),
            ('Statut juridique / acte constitutif',                               False, '.pdf,.jpg,.png', 6),
            ('Quitus fiscal',                                                     False, '.pdf',            7),
        ]
    },
    {
        'code': 'EXTENSION', 'libelle': "Demande d'Extension",
        'description': "Extension d'une autorisation industrielle existante",
        'pieces': [
            ("Copie de l'autorisation d'origine",                                 True,  '.pdf,.jpg,.png', 1),
            ("Plans d'extension / plans architecturaux",                          True,  '.pdf',            2),
            ("Devis estimatif des travaux",                                       True,  '.pdf',            3),
            ("Titre de propriété ou bail du terrain",                             False, '.pdf,.jpg,.png', 4),
            ("Étude d'impact environnemental (si requis)",                        False, '.pdf',            5),
        ]
    },
]

print("\n2. Création des types de demande et pièces requises...")
for t in TYPES:
    pieces = t.pop('pieces')
    td, created = TypeDemande.objects.get_or_create(
        code=t['code'],
        defaults={'libelle': t['libelle'], 'description': t['description'], 'actif': True}
    )
    print(f"   {'✅' if created else '⏩'} TypeDemande: {t['code']} — {t['libelle']}")
    for nom, obligatoire, format_accepte, ordre in pieces:
        pr, pc = PieceRequise.objects.get_or_create(
            type_demande=td, nom=nom,
            defaults={
                'obligatoire':    obligatoire,
                'format_accepte': format_accepte,
                'ordre':          ordre,
            }
        )
        if pc:
            print(f"      + {nom}")
        else:
            # Mettre à jour le format si la pièce existait sans ce champ
            if pr.format_accepte != format_accepte:
                pr.format_accepte = format_accepte
                pr.save()

print(f"""
✅ Initialisation terminée !
   {Role.objects.count()} rôles
   {TypeDemande.objects.count()} types de demande
   {PieceRequise.objects.count()} pièces requises

→ Créer le super admin si pas encore fait :
   python create_admin.py
""")