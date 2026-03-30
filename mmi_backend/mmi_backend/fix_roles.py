"""
fix_roles.py — Nettoyage des rôles multiples actifs
Usage: cd mmi_backend/mmi_backend && python fix_roles.py
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mmi_project.settings')
django.setup()

from api.models import User, UserRole

print("Nettoyage des utilisateurs avec plusieurs rôles actifs...")
fixed = 0

for user in User.objects.all():
    roles_actifs = UserRole.objects.filter(user=user, actif=True)
    if roles_actifs.count() > 1:
        # Garder uniquement le rôle le plus récent
        dernier = roles_actifs.order_by('-assigned_at').first()
        roles_actifs.exclude(pk=dernier.pk).delete()
        print(f"  ✅ {user.email} — gardé: {dernier.role.code}")
        fixed += 1

if fixed == 0:
    print("✅ Aucun utilisateur avec rôles multiples trouvé")
else:
    print(f"\n✅ {fixed} utilisateur(s) corrigé(s)")