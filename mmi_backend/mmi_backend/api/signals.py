"""
Signals Django — MMI Platform
Notifications automatiques email pour chaque étape du circuit.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger('api')

FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

# ── Mapping étape → notification ─────────────────────────────
NOTIF_CONFIG = {
    # SC
    'SC_RECEPTION': {
        'dest': 'demandeur',
        'titre': '📋 Votre demande a été reçue',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Votre demande {d.numero_ref} a été enregistrée et déchargée numériquement "
            f"par le Secrétariat Central. Elle sera transmise au Secrétaire Général."
        ),
    },
    'SC_TRANSMISSION_SG': {
        'dest': 'sg',
        'titre': '📨 Nouveau dossier à traiter',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} ({d.raison_sociale}) vient d\'être transmis "
            f"au Secrétariat Général pour traitement. Veuillez en prendre charge."
        ),
    },
    # DGI Secrétariat
    'DGI_SEC_IMPRESSION': {
        'dest': 'agent',
        'titre': '🖨️ Dossier disponible pour impression',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} est disponible pour impression "
            f"afin de poursuivre le circuit papier."
        ),
    },
    # SG
    'SG_LECTURE': {
        'dest': 'demandeur',
        'titre': '👁️ Votre dossier est en cours d\'examen',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Le Secrétaire Général a pris en charge votre dossier {d.numero_ref}."
        ),
    },
    'SG_TRANSMISSION_MIN': {
        'dest': 'ministre',
        'titre': '📨 Dossier transmis pour signature',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} ({d.raison_sociale}) vous a été transmis "
            f"par le Secrétaire Général pour examen et décision."
        ),
    },
    'SG_TRANSMISSION_DGI': {
        'dest': 'dgi',
        'titre': '📨 Nouveau dossier en instruction',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} ({d.raison_sociale}) — {d.type_demande.libelle} "
            f"vous a été transmis par le Secrétaire Général pour instruction technique."
        ),
    },
    # Ministre
    'MIN_LECTURE': {
        'dest': 'demandeur',
        'titre': '👁️ Votre dossier est examiné par le Ministre',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Le Ministre a pris connaissance de votre dossier {d.numero_ref}."
        ),
    },
    'MIN_TRANSMISSION_DGI': {
        'dest': 'dgi',
        'titre': '📨 Dossier transmis par le Ministre',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} ({d.raison_sociale}) vous a été transmis "
            f"par le Ministre pour instruction technique à la DGI."
        ),
    },
    # DGI
    'DGI_INSTRUCTION': {
        'dest': 'demandeur',
        'titre': '⚙️ Votre dossier est en instruction technique',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"La Direction Générale de l\'Industrie instruit techniquement "
            f"votre dossier {d.numero_ref}."
        ),
    },
    'DGI_TRANSMISSION_DDPI': {
        'dest': 'ddpi',
        'titre': '📨 Nouveau dossier à traiter — DDPI',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier {d.numero_ref} ({d.raison_sociale}) — {d.type_demande.libelle} "
            f"vous a été transmis par la DGI pour traitement."
        ),
    },
    'DGI_SIGNATURE': {
        'dest': 'demandeur',
        'titre': '✍️ Votre dossier est en attente de signature DGI',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Votre dossier {d.numero_ref} est en cours de signature "
            f"par le Directeur Général de l\'Industrie."
        ),
    },
    # DDPI
    'DDPI_VERIFICATION': {
        'dest': 'demandeur',
        'titre': '🔍 Votre dossier est en cours de vérification',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"La DDPI vérifie la complétude de votre dossier {d.numero_ref}."
        ),
    },
    'DDPI_INCOMPLET': {
        'dest': 'demandeur',
        'titre': '⚠️ Dossier incomplet — Action requise',
        'type': 'INCOMPLET',
        'msg': lambda d, e: (
            f"Votre dossier {d.numero_ref} présente des insuffisances.\n\n"
            f"Motif communiqué par la DDPI :\n{e.commentaire or 'Voir votre espace demandeur.'}\n\n"
            f"Connectez-vous sur {FRONTEND_URL}/connexion pour consulter les détails."
        ),
    },
    'DDPI_CHEF_BP': {
        'dest': 'ddpi_chef_bp',
        'titre': '📨 Nouveau dossier BP à traiter',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier BP {d.numero_ref} ({d.raison_sociale}) vous a été assigné "
            f"pour traitement par le Directeur DDPI."
        ),
    },
    'DDPI_CHEF_USINES': {
        'dest': 'ddpi_chef_usines',
        'titre': '📨 Nouveau dossier Usine à traiter',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Le dossier Usine {d.numero_ref} ({d.raison_sociale}) vous a été assigné "
            f"pour traitement par le Directeur DDPI."
        ),
    },
    'DDPI_VISITE': {
        'dest': 'demandeur',
        'titre': '📅 Visite des lieux programmée',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Une visite des lieux de votre établissement ({d.raison_sociale}) "
            f"a été programmée dans le cadre de votre demande {d.numero_ref}.\n"
            f"{('Détails : ' + e.commentaire) if e.commentaire else ''}"
        ),
    },
    'DDPI_PV_COMITE_BP': {
        'dest': 'demandeur',
        'titre': '📋 PV du comité BP déposé',
        'type': 'INFO',
        'msg': lambda d, e: (
            f"Le procès-verbal du comité BP relatif à votre dossier {d.numero_ref} "
            f"a été enregistré. Vous serez informé de la suite."
        ),
    },
    'DDPI_QUITTANCE_BP': {
        'dest': 'demandeur',
        'titre': '💳 Quittance de paiement requise',
        'type': 'ACTION',
        'msg': lambda d, e: (
            f"Suite à l\'approbation de votre dossier {d.numero_ref} par le comité BP, "
            f"vous devez déposer la quittance de paiement des frais d\'autorisation "
            f"pour finaliser votre demande.\n"
            f"Connectez-vous sur {FRONTEND_URL}/connexion pour déposer votre quittance."
        ),
    },
    'DDPI_ACCORD_PRINCIPE': {
        'dest': 'demandeur',
        'titre': '✅ Accord de principe accordé !',
        'type': 'ACCORD',
        'msg': lambda d, e: (
            f"Félicitations ! Un accord de principe a été accordé pour votre "
            f"demande {d.numero_ref} — {d.raison_sociale}.\n"
            f"La rédaction de l\'arrêté officiel est en cours."
        ),
    },
    'DDPI_REJET': {
        'dest': 'demandeur',
        'titre': '❌ Demande rejetée',
        'type': 'REJET',
        'msg': lambda d, e: (
            f"Votre demande {d.numero_ref} a été rejetée.\n\n"
            f"Motif : {e.commentaire or 'Consultez votre espace demandeur.'}\n\n"
            f"Vous pouvez déposer une nouvelle demande ou contacter la DDPI."
        ),
    },
    # MMI / Ministre
    'MMI_SIGNATURE': {
        'dest': 'demandeur',
        'titre': '🎉 Votre autorisation est prête !',
        'type': 'VALIDATION',
        'msg': lambda d, e: (
            f"Félicitations ! Votre autorisation officielle pour {d.raison_sociale} "
            f"a été signée et est disponible au téléchargement.\n"
            f"Connectez-vous sur {FRONTEND_URL}/connexion pour la télécharger."
        ),
    },
}


@receiver(post_save, sender='api.EtapeTraitement')
def notifier_etape(sender, instance, created, **kwargs):
    """Envoie notifications email + interne à chaque étape du circuit."""
    if not created:
        return

    etape   = instance
    demande = etape.demande
    config  = NOTIF_CONFIG.get(etape.etape_code)
    if not config:
        return

    titre = config['titre']
    type_n = config['type']

    # ── Déterminer le destinataire ─────────────────────────────
    dest_user = None
    dest_email = None

    if config['dest'] == 'demandeur':
        dest_user  = demande.demandeur
        dest_email = demande.demandeur.email

    elif config['dest'] in ('sg', 'ministre', 'dgi', 'ddpi',
                             'ddpi_chef_bp', 'ddpi_chef_usines'):
        from api.models import User, UserRole
        ROLE_MAP = {
            'sg':              'SEC_GENERAL',
            'ministre':        'MINISTRE',
            'dgi':             'DGI_DIRECTEUR',
            'ddpi':            'DDPI_DIRECTEUR',
            'ddpi_chef_bp':    'DDPI_CHEF_BP',
            'ddpi_chef_usines':'DDPI_CHEF_USINES',
        }
        role_code = ROLE_MAP.get(config['dest'])
        if role_code:
            users = User.objects.filter(
                user_roles__role__code=role_code,
                user_roles__actif=True,
                is_active=True
            )
            if users.exists():
                dest_user  = users.first()
                dest_email = [u.email for u in users]

    elif config['dest'] == 'agent':
        # Notifier l'acteur qui vient d'agir
        dest_user  = etape.acteur
        dest_email = etape.acteur.email

    if not dest_user and not dest_email:
        return

    # ── Construire le message ──────────────────────────────────
    try:
        message = config['msg'](demande, etape)
    except Exception:
        message = f"Action sur le dossier {demande.numero_ref}."

    # ── Notification interne ───────────────────────────────────
    from api.models import Notification
    if dest_user:
        try:
            Notification.objects.create(
                destinataire=dest_user,
                demande=demande,
                type_notif=type_n,
                titre=titre,
                message=message,
            )
        except Exception as exc:
            logger.warning(f"Notification interne échouée: {exc}")

    # ── Email ─────────────────────────────────────────────────
    emails = dest_email if isinstance(dest_email, list) else ([dest_email] if dest_email else [])
    emails = [e for e in emails if e]
    if emails:
        try:
            send_mail(
                subject=f"[MMI] {titre} — {demande.numero_ref}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=emails,
                fail_silently=True,
            )
            logger.info(f"Email envoyé pour {etape.etape_code} → {emails}")
        except Exception as exc:
            logger.warning(f"Email échoué pour {etape.etape_code}: {exc}")


@receiver(post_save, sender='api.User')
def envoyer_identifiant_unique(sender, instance, created, **kwargs):
    """À la création d\'un compte demandeur : envoie l\'identifiant unique."""
    if not created:
        return
    if not instance.has_role('DEMANDEUR'):
        return

    try:
        send_mail(
            subject="Votre identifiant de connexion — Plateforme MMI",
            message=(
                f"Bonjour {instance.nom_complet},\n\n"
                f"Votre compte a été créé avec succès sur la plateforme MMI.\n\n"
                f"Votre identifiant unique : {instance.identifiant_unique}\n\n"
                f"Conservez précieusement cet identifiant.\n"
                f"Connexion : {FRONTEND_URL}/connexion\n\n"
                f"Cordialement,\nL\'équipe MMI — Mauritanie"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=True,
        )
    except Exception as exc:
        logger.warning(f"Email identifiant non envoyé à {instance.email}: {exc}")