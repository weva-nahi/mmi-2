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
