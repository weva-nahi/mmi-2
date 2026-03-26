"""
Script d'initialisation de la base de données MMI.
Lance depuis le dossier mmi_backend : python setup_db.py
"""
import os, sys, django

# Chemin absolu vers le projet
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mmi_project.settings')
django.setup()

from api.models import TypeDemande, PieceRequise, Role

print("\n=== Initialisation base de données MMI ===\n")

# ── Rôles ─────────────────────────────────────────────────────
ROLES = [
    ('SUPER_ADMIN',     'Super Administrateur',      1),
    ('DEMANDEUR',       'Demandeur',                10),
    ('SEC_CENTRAL',     'Agent Secrétariat Central',20),
    ('SEC_GENERAL',     'Secrétaire Général',       30),
    ('MINISTRE',        'Ministre MMI',             40),
    ('DGI_DIRECTEUR',   'Directeur DGI',            50),
    ('DGI_SECRETARIAT', 'Secrétariat DGI',          51),
    ('DDPI_CHEF',       'Chef Service DDPI',        60),
    ('DDPI_AGENT',      'Agent DDPI',               61),
    ('MMI_SIGNATAIRE',  'Signataire MMI',           70),
]
print("1. Création des rôles...")
for code, nom, niveau in ROLES:
    _, created = Role.objects.get_or_create(code=code, defaults={'nom': nom, 'niveau': niveau})
    print(f"   {'✅' if created else '⏩'} {code}")

# ── Types de demande + Pièces requises ────────────────────────
TYPES = [
    {
        'code': 'BP', 'libelle': "Autorisation Boulangerie / Pâtisserie",
        'description': "Autorisation d'ouverture d'une boulangerie ou pâtisserie",
        'pieces': [
            ('Statut certifié par le notaire',                                   True,  1),
            ('Registre de commerce local',                                        True,  2),
            ("Numéro d'identification fiscale (NIF)",                             True,  3),
            ("Certificat d'enregistrement CNSS",                                  True,  4),
            ("Demande adressée au Ministre chargé de l'Industrie",               True,  5),
            ("Copie CIN et téléphone du propriétaire",                           True,  6),
            ("Titre de propriété ou contrat de bail (min 5 ans)",                True,  7),
            ("Étude de faisabilité économique",                                   True,  8),
            ("Copie du cahier des charges signée par l'intéressé",               True,  9),
        ]
    },
    {
        'code': 'USINE_EAU', 'libelle': "Autorisation Unité Eau Minérale",
        'description': "Autorisation de production d'eau minérale embouteillée",
        'pieces': [
            ('Statut certifié par le notaire',                                   True,  1),
            ('Registre de commerce local',                                        True,  2),
            ("NIF (Numéro d'Identification Fiscale)",                             True,  3),
            ("Certificat d'enregistrement CNSS",                                  True,  4),
            ("Autorisation du Ministère de l'Eau (MHA) pour le forage",          True,  5),
            ("Analyses des échantillons d'eau (laboratoire agréé)",              True,  6),
            ("Étude de faisabilité du projet",                                    True,  7),
            ("Déclaration de conformité de l'emballage (MMI + Santé)",           True,  8),
            ("Copie du cahier des charges signé",                                 True,  9),
            ("Demande d'autorisation adressée au Ministre",                       True, 10),
            ("Copie d'identité du propriétaire",                                  True, 11),
        ]
    },
    {
        'code': 'UNITE', 'libelle': "Autorisation Unité Industrielle",
        'description': "Autorisation d'ouverture d'une unité de production industrielle",
        'pieces': [
            ('Statut juridique',                                                  True,  1),
            ('Registre de commerce',                                              True,  2),
            ('NIF',                                                               True,  3),
            ("Certificat d'enregistrement CNSS",                                  True,  4),
            ("Demande adressée au Ministre de l'Industrie",                       True,  5),
            ("Étude de faisabilité",                                              True,  6),
            ("TDR — Termes de référence pour l'étude d'impact environnemental",  True,  7),
            ("Coordonnées GPS (document ou capture)",                             True,  8),
            ("Fiches techniques des équipements",                                 True,  9),
            ("Titre foncier ou contrat de bail",                                  True, 10),
            ("Cahier des charges signé",                                          True, 11),
        ]
    },
    {
        'code': 'RENOUVELLEMENT', 'libelle': "Renouvellement d'Enregistrement",
        'description': "Renouvellement d'enregistrement industriel MMI 2025",
        'pieces': [
            ('Registre de commerce (RCCM)',                                       True,  1),
            ('Attestation NIF',                                                   True,  2),
            ("Ancien numéro d'enregistrement / autorisation",                     True,  3),
            ('Bilan comptable 2023/2024',                                         False, 4),
            ("Attestation de régularité CNSS",                                    False, 5),
            ('Statut juridique / acte constitutif',                               False, 6),
            ('Quitus fiscal',                                                     False, 7),
        ]
    },
    {
        'code': 'EXTENSION', 'libelle': "Demande d'Extension",
        'description': "Extension d'une autorisation industrielle existante",
        'pieces': [
            ("Copie de l'autorisation d'origine",                                 True,  1),
            ("Plans d'extension / plans architecturaux",                          True,  2),
            ("Devis estimatif des travaux",                                       True,  3),
            ("Titre de propriété ou bail du terrain",                             False, 4),
            ("Étude d'impact environnemental (si requis)",                        False, 5),
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
    for nom, obligatoire, ordre in pieces:
        pr, pc = PieceRequise.objects.get_or_create(
            type_demande=td, nom=nom,
            defaults={'obligatoire': obligatoire, 'ordre': ordre}
        )
        if pc:
            print(f"      + {nom}")

print(f"""
✅ Initialisation terminée !
   {Role.objects.count()} rôles
   {TypeDemande.objects.count()} types de demande
   {PieceRequise.objects.count()} pièces requises

→ Vous pouvez maintenant créer le superadmin :
   python manage.py createsuperuser

→ Puis démarrer le serveur :
   python manage.py runserver
""")