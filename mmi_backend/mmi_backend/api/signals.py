"""
Signals Django — MMI Platform
Actions automatiques déclenchées par les événements modèles.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger('api')


@receiver(post_save, sender='api.User')
def envoyer_identifiant_unique(sender, instance, created, **kwargs):
    """
    À la création d'un compte demandeur :
    Envoie l'identifiant unique par email (principal + récupération).
    """
    if not created:
        return
    if not instance.has_role('DEMANDEUR'):
        return

    sujet = "Votre identifiant de connexion — Plateforme MMI"
    message = f"""
Bonjour {instance.nom_complet},

Votre compte a été créé avec succès sur la plateforme du Ministère des Mines et de l'Industrie.

Votre identifiant unique de connexion est :

    {instance.identifiant_unique}

Conservez précieusement cet identifiant. Il vous sera demandé à chaque connexion.

Pour vous connecter : https://industrie.mmi.gov.mr/connexion

Cordialement,
L'équipe MMI — Mauritanie
"""

    destinataires = [instance.email]
    if instance.email_recuperation:
        destinataires.append(instance.email_recuperation)

    try:
        send_mail(
            subject=sujet,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinataires,
            fail_silently=False,
        )
        logger.info(f"Email identifiant envoyé à {instance.email}")
    except Exception as e:
        logger.error(f"Échec envoi email identifiant pour {instance.email}: {e}")


@receiver(post_save, sender='api.EtapeTraitement')
def creer_notification_etape(sender, instance, created, **kwargs):
    """
    À chaque nouvelle étape de traitement :
    Crée une notification pour le demandeur.
    """
    if not created:
        return

    from api.models import Notification

    messages = {
        'SC_RECEPTION':         ("Dossier reçu", "Votre dossier a été réceptionné et référencé."),
        'DDPI_INCOMPLET':       ("Dossier incomplet", "Votre dossier est incomplet. Consultez les détails."),
        'DDPI_VISITE':          ("Visite programmée", "Une visite de votre établissement a été programmée."),
        'DDPI_ACCORD_PRINCIPE': ("Accord de principe", "Votre dossier a reçu un accord de principe."),
        'DDPI_REJET':           ("Dossier rejeté", "Votre demande a été rejetée. Consultez le motif."),
        'DGI_SIGNATURE':        ("Signature en cours", "Votre document est en cours de signature."),
        'MMI_SIGNATURE':        ("Signature finale", "Votre arrêté est en attente de signature MMI."),
        'SYSTEME_VALIDATION':   ("Dossier validé !", "Votre autorisation est disponible. Connectez-vous pour la télécharger."),
    }

    if instance.etape_code in messages:
        titre, message_txt = messages[instance.etape_code]
        type_notif = 'validation' if instance.etape_code == 'SYSTEME_VALIDATION' else \
                     'rejet' if instance.etape_code == 'DDPI_REJET' else \
                     'dossier_incomplet' if instance.etape_code == 'DDPI_INCOMPLET' else \
                     'statut_change'

        Notification.objects.create(
            user=instance.demande.demandeur,
            demande=instance.demande,
            type=type_notif,
            titre=titre,
            message=message_txt,
        )


@receiver(post_save, sender='api.EtapeTraitement')
def envoyer_email_retour_demandeur(sender, instance, created, **kwargs):
    """
    Pour les étapes critiques (rejet, incomplet, accord, validation) :
    Envoie un email au demandeur avec le détail de la décision.
    """
    if not created:
        return

    demandeur = instance.demande.demandeur
    if not demandeur.email:
        return

    TEMPLATES = {
        'DDPI_INCOMPLET': {
            'sujet': f"[MMI] Dossier incomplet — {instance.demande.numero_ref}",
            'body': lambda i: f"""
Bonjour {demandeur.nom_complet},

Votre dossier {i.demande.numero_ref} ({i.demande.raison_sociale}) a été examiné par la Direction du Développement et de la Promotion Industrielle (DDPI).

⚠️ DOSSIER INCOMPLET

Motif / Pièces manquantes :
{i.commentaire or 'Veuillez contacter la DDPI pour plus de détails.'}

Vous devez compléter votre dossier pour que le traitement puisse continuer.

👉 Connectez-vous sur : https://industrie.mmi.gov.mr/connexion

Cordialement,
Direction du Développement et de la Promotion Industrielle
Ministère des Mines et de l'Industrie — Mauritanie
"""
        },
        'DDPI_REJET': {
            'sujet': f"[MMI] Demande rejetée — {instance.demande.numero_ref}",
            'body': lambda i: f"""
Bonjour {demandeur.nom_complet},

Après examen de votre dossier {i.demande.numero_ref} ({i.demande.raison_sociale}), la Direction du Développement et de la Promotion Industrielle a rendu la décision suivante :

❌ DEMANDE REJETÉE

Motif du rejet :
{i.commentaire or 'Dossier non conforme aux exigences réglementaires.'}

Si vous souhaitez contester cette décision, vous pouvez contacter la DDPI :
- Email : contact-mmi@mmi.gov.mr
- Tél : 00 222 45 24 25 41

Cordialement,
Direction du Développement et de la Promotion Industrielle
Ministère des Mines et de l'Industrie — Mauritanie
"""
        },
        'DDPI_ACCORD_PRINCIPE': {
            'sujet': f"[MMI] Accord de principe — {instance.demande.numero_ref}",
            'body': lambda i: f"""
Bonjour {demandeur.nom_complet},

Nous avons le plaisir de vous informer que votre dossier {i.demande.numero_ref} ({i.demande.raison_sociale}) a reçu un accord de principe.

✅ ACCORD DE PRINCIPE ACCORDÉ

Votre dossier est en cours de finalisation pour la rédaction de l'arrêté officiel.
Vous serez notifié dès que l'autorisation sera disponible.

Connectez-vous pour suivre l'avancement : https://industrie.mmi.gov.mr/connexion

Cordialement,
Direction du Développement et de la Promotion Industrielle
Ministère des Mines et de l'Industrie — Mauritanie
"""
        },
        'SYSTEME_VALIDATION': {
            'sujet': f"[MMI] ✅ Autorisation délivrée — {instance.demande.numero_ref}",
            'body': lambda i: f"""
Bonjour {demandeur.nom_complet},

Votre autorisation industrielle a été officiellement délivrée !

🎉 AUTORISATION DÉLIVRÉE

Référence : {i.demande.numero_ref}
Établissement : {i.demande.raison_sociale}
Type : {i.demande.type_demande}

Connectez-vous pour télécharger vos documents officiels :
https://industrie.mmi.gov.mr/connexion

Cordialement,
Ministère des Mines et de l'Industrie
République Islamique de Mauritanie
"""
        },
    }

    if instance.etape_code not in TEMPLATES:
        return

    template = TEMPLATES[instance.etape_code]
    destinataires = [demandeur.email]
    if demandeur.email_recuperation:
        destinataires.append(demandeur.email_recuperation)

    try:
        send_mail(
            subject=template['sujet'],
            message=template['body'](instance),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinataires,
            fail_silently=False,
        )
        logger.info(f"Email retour demandeur envoyé [{instance.etape_code}] → {demandeur.email}")
    except Exception as e:
        logger.error(f"Échec email retour demandeur [{instance.etape_code}] → {demandeur.email}: {e}")