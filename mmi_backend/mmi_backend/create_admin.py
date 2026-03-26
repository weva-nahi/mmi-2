"""
Script de création du Super Administrateur MMI.
Lance : python create_admin.py
"""
import os, sys, django

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mmi_project.settings')
django.setup()

from api.models import User, Role, UserRole

# ── Identifiants du Super Admin ──────────────────────────────
EMAIL    = "admin@mmi.gov.mr"
PASSWORD = "Admin@MMI2025!"
NOM      = "Administrateur"
PRENOM   = "Super"

print("\n=== Création du Super Administrateur MMI ===\n")

# Vérifier si déjà existant
if User.objects.filter(email=EMAIL).exists():
    u = User.objects.get(email=EMAIL)
    u.set_password(PASSWORD)
    u.is_super_admin = True
    u.is_staff       = True
    u.is_superuser   = True
    u.is_active      = True
    u.save()
    print(f"⏩ Compte existant mis à jour : {EMAIL}")
else:
    u = User.objects.create_superuser(
        email        = EMAIL,
        password     = PASSWORD,
        nom          = NOM,
        prenom       = PRENOM,
        is_super_admin = True,
    )
    print(f"✅ Super Admin créé : {EMAIL}")

# Attribuer le rôle SUPER_ADMIN
role, _ = Role.objects.get_or_create(
    code='SUPER_ADMIN',
    defaults={'nom': 'Super Administrateur', 'niveau': 1}
)
UserRole.objects.get_or_create(user=u, role=role, defaults={'actif': True})

print(f"""
╔══════════════════════════════════════════════╗
║         SUPER ADMINISTRATEUR MMI             ║
╠══════════════════════════════════════════════╣
║  URL      : http://localhost:3000            ║
║  Page     : /connexion-agent                 ║
║  Email    : admin@mmi.gov.mr                 ║
║  Password : Admin@MMI2025!                   ║
╚══════════════════════════════════════════════╝

⚠️  Changez le mot de passe après la première connexion !
""")