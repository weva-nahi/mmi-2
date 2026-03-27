"""
Générateur PDF Autorisation Officielle MMI — Mauritanie
Style inspiré de l'extrait numérique ANRPTS mauritanien
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
import os, random

W, H = A4

# ── Palette couleurs ──────────────────────────────────────────
VERT_FONCE = colors.HexColor('#0A4A1E')
VERT_MMI   = colors.HexColor('#1B6B30')
VERT_CLAIR = colors.HexColor('#E8F5EC')
OR         = colors.HexColor('#C8A400')
GRIS_TEXTE = colors.HexColor('#1A1A1A')
GRIS_FOND  = colors.HexColor('#F7F7F7')
ROUGE      = colors.HexColor('#C0392B')
BLANC      = colors.white

# ── Champs par type de demande ────────────────────────────────
CHAMPS_PAR_TYPE = {
    'BP': {
        'titre_complet': 'AUTORISATION D\'OUVERTURE — BOULANGERIE / PÂTISSERIE',
        'libelle': 'Boulangerie / Pâtisserie',
        'champs_demandeur': [
            ('Nom du responsable',   'nom_responsable'),
            ('NIF',                   'nif'),
            ('Téléphone',             'telephone'),
            ('Email',                 'email'),
            ('Adresse du siège',      'adresse'),
            ('Forme juridique',       'forme_juridique'),
        ],
        'champs_etablissement': [
            ('Nom de l\'établissement', 'nom_etablissement'),
            ('Type d\'activité',        'type_activite'),
            ('Wilaya',                  'wilaya'),
            ('Adresse du local',        'adresse_local'),
            ('Description activité',    'description_activite'),
        ],
    },
    'USINE_EAU': {
        'titre_complet': 'AUTORISATION D\'EXPLOITATION — UNITÉ DE PRODUCTION D\'EAU MINÉRALE',
        'libelle': 'Unité de Production d\'Eau Minérale',
        'champs_demandeur': [
            ('Nom du responsable',   'nom_responsable'),
            ('NIF',                   'nif'),
            ('Téléphone',             'telephone'),
            ('Email',                 'email'),
            ('Adresse du siège',      'adresse'),
            ('Forme juridique',       'forme_juridique'),
        ],
        'champs_etablissement': [
            ('Nom de l\'établissement', 'nom_etablissement'),
            ('Capacité de production',  'capacite_production'),
            ('Wilaya',                  'wilaya'),
            ('Site du forage',          'adresse_local'),
            ('Description activité',    'description_activite'),
        ],
    },
    'UNITE': {
        'titre_complet': 'AUTORISATION D\'OUVERTURE — UNITÉ INDUSTRIELLE',
        'libelle': 'Unité Industrielle',
        'champs_demandeur': [
            ('Nom du responsable',   'nom_responsable'),
            ('NIF',                   'nif'),
            ('Téléphone',             'telephone'),
            ('Email',                 'email'),
            ('Adresse du siège',      'adresse'),
            ('Capital social (MRU)',   'capital_social'),
        ],
        'champs_etablissement': [
            ('Nom de l\'unité',        'nom_etablissement'),
            ('Secteur d\'activité',    'type_activite'),
            ('Wilaya',                 'wilaya'),
            ('Adresse du site',        'adresse_local'),
            ('Emplois directs',        'emplois_directs'),
            ('Description activité',   'description_activite'),
        ],
    },
    'RENOUVELLEMENT': {
        'titre_complet': 'RENOUVELLEMENT D\'ENREGISTREMENT INDUSTRIEL',
        'libelle': 'Renouvellement d\'Enregistrement',
        'champs_demandeur': [
            ('Nom du responsable',    'nom_responsable'),
            ('NIF',                    'nif'),
            ('Téléphone',              'telephone'),
            ('Email',                  'email'),
            ('Ancien N° autorisation', 'ancien_numero'),
        ],
        'champs_etablissement': [
            ('Nom de l\'établissement', 'nom_etablissement'),
            ('Type d\'activité',        'type_activite'),
            ('Wilaya',                  'wilaya'),
            ('Adresse',                 'adresse_local'),
        ],
    },
    'EXTENSION': {
        'titre_complet': 'AUTORISATION D\'EXTENSION D\'ACTIVITÉS INDUSTRIELLES',
        'libelle': 'Extension d\'Activités',
        'champs_demandeur': [
            ('Nom du responsable',    'nom_responsable'),
            ('NIF',                    'nif'),
            ('Téléphone',              'telephone'),
            ('Email',                  'email'),
            ('N° autorisation d\'origine', 'ancien_numero'),
        ],
        'champs_etablissement': [
            ('Nom de l\'établissement', 'nom_etablissement'),
            ('Activité actuelle',       'type_activite'),
            ('Extension demandée',      'description_extension'),
            ('Wilaya',                  'wilaya'),
        ],
    },
}

def qr_placeholder(c, x, y, size, seed=""):
    """QR code simulé identique au style ANRPTS"""
    random.seed(hash(seed + str(x)) % 9999)
    cell = size / 21
    c.saveState()
    c.setFillColor(BLANC)
    c.rect(x, y, size, size, fill=1, stroke=0)

    c.setFillColor(colors.black)
    for row in range(21):
        for col in range(21):
            # Coins position markers
            in_tl = row < 7 and col < 7
            in_tr = row < 7 and col > 13
            in_bl = row > 13 and col < 7
            if in_tl or in_tr or in_bl:
                lr = row if not in_tr else row
                lc = col if not in_tr else col - 14
                lr2 = row if not in_bl else row - 14
                lc2 = col if not in_bl else col
                r = lr if in_tl else (lr if in_tr else lr2)
                cc = lc if in_tl else (lc if in_tr else lc2)
                if r in [0,6] or cc in [0,6] or (2<=r<=4 and 2<=cc<=4):
                    c.rect(x+col*cell, y+(20-row)*cell, cell, cell, fill=1, stroke=0)
            else:
                if random.random() > 0.52:
                    c.rect(x+col*cell, y+(20-row)*cell, cell, cell, fill=1, stroke=0)

    c.setFillColor(BLANC)
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.rect(x, y, size, size, fill=0, stroke=1)
    c.restoreList()
    c.restoreState()

def section_titre(c, texte, y):
    """En-tête de section vert foncé — style ANRPTS"""
    c.setFillColor(VERT_FONCE)
    c.rect(1.5*cm, y-2, W-3*cm, 17, fill=1, stroke=0)
    c.setFillColor(BLANC)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(2*cm, y+3, texte)
    return y - 20

def champ(c, label, valeur, x, y, largeur):
    """Un champ label+valeur avec fond alternant"""
    c.setFillColor(GRIS_FOND)
    c.rect(x-1, y-3, largeur+2, 17, fill=1, stroke=0)
    # Barre verte gauche
    c.setFillColor(VERT_MMI)
    c.rect(x-1, y-3, 2.5, 17, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#777777'))
    c.setFont("Helvetica", 6.5)
    c.drawString(x+4, y+8, label)
    c.setFillColor(GRIS_TEXTE)
    c.setFont("Helvetica-Bold", 8)
    val = str(valeur) if valeur else '—'
    # Tronquer si trop long
    while c.stringWidth(val, "Helvetica-Bold", 8) > largeur - 8 and len(val) > 3:
        val = val[:-2] + '…'
    c.drawString(x+4, y, val)

def generer_autorisation(data: dict, output_path: str, logo_path: str = None):
    """Génère le PDF d'autorisation officielle MMI."""

    type_code = data.get('type_demande', 'BP')
    config    = CHAMPS_PAR_TYPE.get(type_code, CHAMPS_PAR_TYPE['BP'])
    verify_url = f"{data.get('plateforme_url','https://plateforme.mmi.gov.mr')}/verify?ref={data.get('numero_auto','')}"

    cv = canvas.Canvas(output_path, pagesize=A4)
    cv.setTitle(f"Autorisation {data.get('numero_auto','')}")
    cv.setAuthor("Ministère des Mines et de l'Industrie — Mauritanie")

    # ══════════════════════════════════════════════════════════
    # EN-TÊTE VERT FONCÉ
    # ══════════════════════════════════════════════════════════
    cv.setFillColor(VERT_FONCE)
    cv.rect(0, H-95, W, 95, fill=1, stroke=0)
    cv.setFillColor(OR)
    cv.rect(0, H-95, W, 2.5, fill=1, stroke=0)  # ligne or bas header

    # Logo MMI à gauche
    logo_x, logo_y, logo_w = 1.5*cm, H-85, 2*cm
    logo_drawn = False
    if logo_path and os.path.exists(logo_path):
        try:
            cv.drawImage(logo_path, logo_x, logo_y, width=logo_w, height=logo_w,
                         preserveAspectRatio=True, mask='auto')
            logo_drawn = True
        except Exception:
            pass
    if not logo_drawn:
        # Cercle placeholder
        cv.setFillColor(OR)
        cv.circle(logo_x + logo_w/2, logo_y + logo_w/2, logo_w/2, fill=1, stroke=0)
        cv.setFillColor(VERT_FONCE)
        cv.setFont("Helvetica-Bold", 7)
        cv.drawCentredString(logo_x + logo_w/2, logo_y + logo_w/2 - 3, "MMI")

    # Textes en-tête centrés
    cv.setFillColor(BLANC)
    cv.setFont("Helvetica-Bold", 8.5)
    cv.drawCentredString(W/2, H-18, "REPUBLIQUE ISLAMIQUE DE MAURITANIE")
    cv.setFont("Helvetica", 7)
    cv.setFillColor(OR)
    cv.drawCentredString(W/2, H-30, "شرف — إخاء — عدل")
    cv.setFillColor(BLANC)
    cv.setFont("Helvetica-Bold", 10.5)
    cv.drawCentredString(W/2, H-46, "MINISTÈRE DES MINES ET DE L'INDUSTRIE")
    cv.setFont("Helvetica", 7.5)
    cv.drawCentredString(W/2, H-59, "Direction Générale de l'Industrie")
    cv.drawCentredString(W/2, H-70, "Plateforme Numérique MMIAPP")
    cv.setFillColor(OR)
    cv.setFont("Helvetica-Bold", 7)
    cv.drawCentredString(W/2, H-82, f"N° Dossier : {data.get('identifiant_demandeur','—')}")

    # ══════════════════════════════════════════════════════════
    # RANGÉE DE QR CODES (style ANRPTS : 4 à gauche + 4 à droite)
    # ══════════════════════════════════════════════════════════
    qr_s = 1.45*cm
    qr_y = H - 140
    gap  = 1*mm

    for i in range(4):
        try:
            qr_placeholder(cv, 1.5*cm + i*(qr_s+gap), qr_y, qr_s, verify_url+str(i))
        except Exception:
            pass

    for i in range(4):
        try:
            qr_placeholder(cv, W - 1.5*cm - (i+1)*qr_s - i*gap, qr_y, qr_s, verify_url+str(i+4))
        except Exception:
            pass

    # ══════════════════════════════════════════════════════════
    # TITRE DU DOCUMENT
    # ══════════════════════════════════════════════════════════
    ty = H - 163
    cv.setFillColor(GRIS_TEXTE)
    cv.setFont("Helvetica-Bold", 13)
    cv.drawCentredString(W/2, ty, "AUTORISATION ADMINISTRATIVE")

    cv.setFont("Helvetica-Bold", 9)
    cv.setFillColor(VERT_MMI)
    cv.drawCentredString(W/2, ty-16, config['titre_complet'])

    # Ligne décorative
    cv.setStrokeColor(OR)
    cv.setLineWidth(2.5)
    cv.line(W/2-5.5*cm, ty-25, W/2+5.5*cm, ty-25)
    cv.setLineWidth(0.8)
    cv.setStrokeColor(VERT_MMI)
    cv.line(W/2-5.5*cm, ty-28.5, W/2+5.5*cm, ty-28.5)

    current_y = ty - 48

    # ══════════════════════════════════════════════════════════
    # SECTION DEMANDEUR — champs dynamiques 2 colonnes
    # ══════════════════════════════════════════════════════════
    current_y = section_titre(cv, "Intéressé :", current_y)

    champs_d = config['champs_demandeur']
    col_w = (W - 4*cm) / 2
    for i in range(0, len(champs_d), 2):
        label1, key1 = champs_d[i]
        champ(cv, label1, data.get(key1,''), 1.8*cm, current_y, col_w)
        if i+1 < len(champs_d):
            label2, key2 = champs_d[i+1]
            champ(cv, label2, data.get(key2,''), 1.8*cm + col_w + 4*mm, current_y, col_w)
        current_y -= 22

    current_y -= 6

    # ══════════════════════════════════════════════════════════
    # SECTION ÉTABLISSEMENT
    # ══════════════════════════════════════════════════════════
    current_y = section_titre(cv, "Établissement :", current_y)

    champs_e = config['champs_etablissement']
    for i in range(0, len(champs_e), 2):
        label1, key1 = champs_e[i]
        champ(cv, label1, data.get(key1,''), 1.8*cm, current_y, col_w)
        if i+1 < len(champs_e):
            label2, key2 = champs_e[i+1]
            champ(cv, label2, data.get(key2,''), 1.8*cm + col_w + 4*mm, current_y, col_w)
        current_y -= 22

    current_y -= 6

    # ══════════════════════════════════════════════════════════
    # SECTION AUTORISATION
    # ══════════════════════════════════════════════════════════
    current_y = section_titre(cv, "Détails de l'autorisation :", current_y)

    champ(cv, "Numéro d'autorisation", data.get('numero_auto',''), 1.8*cm, current_y, col_w)
    champ(cv, "Numéro de dossier",     data.get('numero_ref',''),  1.8*cm+col_w+4*mm, current_y, col_w)
    current_y -= 22

    champ(cv, "Date de délivrance",   data.get('date_delivrance',''), 1.8*cm, current_y, col_w)
    date_exp = data.get('date_expiration', '')
    champ(cv, "Date d'expiration",
          date_exp if date_exp else 'Sans expiration (Extension)',
          1.8*cm+col_w+4*mm, current_y, col_w)
    current_y -= 28

    current_y -= 8

    # ══════════════════════════════════════════════════════════
    # MENTION OFFICIELLE
    # ══════════════════════════════════════════════════════════
    current_y = section_titre(cv, "Mention officielle :", current_y)
    current_y -= 4

    nom_resp = data.get('nom_responsable', 'le demandeur')
    type_act = data.get('type_activite', config['libelle'].lower())
    nom_etab = data.get('nom_etablissement', '—')
    date_del = data.get('date_delivrance','—')
    date_exp_txt = f"jusqu'au {date_exp}" if date_exp else "sans limitation de durée"

    mention = (
        f"Le Ministère des Mines et de l'Industrie de la République Islamique de Mauritanie "
        f"autorise M./Mme {nom_resp} à exercer l'activité de {type_act} sous la "
        f"dénomination « {nom_etab} », conformément aux dispositions législatives "
        f"et réglementaires en vigueur en Mauritanie, à compter du {date_del} et ce {date_exp_txt}. "
        f"Le bénéficiaire s'engage à respecter l'ensemble des obligations légales, "
        f"fiscales et environnementales liées à cette activité."
    )

    text_x = 1.9*cm
    text_w = W - 3.8*cm
    mots, ligne, lignes = mention.split(), "", []
    for mot in mots:
        test = (ligne + " " + mot).strip()
        if cv.stringWidth(test, "Helvetica", 8) < text_w:
            ligne = test
        else:
            lignes.append(ligne)
            ligne = mot
    if ligne:
        lignes.append(ligne)

    cv.setFillColor(GRIS_TEXTE)
    cv.setFont("Helvetica", 8)
    for l in lignes:
        cv.drawString(text_x, current_y, l)
        current_y -= 13
    current_y -= 8

    # ══════════════════════════════════════════════════════════
    # SIGNATURE (dynamique — nom du ministre)
    # ══════════════════════════════════════════════════════════
    sig_x = W - 8*cm
    sig_y = current_y - 5

    cv.setFont("Helvetica", 8)
    cv.setFillColor(GRIS_TEXTE)
    cv.drawString(sig_x, sig_y, f"Nouakchott, le {date_del}")
    cv.setFont("Helvetica-Bold", 8)
    cv.drawString(sig_x, sig_y-13, data.get('signataire_titre', 'Le Ministre'))
    cv.setFont("Helvetica", 8)
    cv.drawString(sig_x, sig_y-25, data.get('signataire_nom', ''))

    # Ligne signature pointillée
    cv.setStrokeColor(colors.HexColor('#BBBBBB'))
    cv.setDash(3, 3)
    cv.line(sig_x, sig_y-55, sig_x+5.5*cm, sig_y-55)
    cv.setDash()
    cv.setFont("Helvetica", 6.5)
    cv.setFillColor(colors.HexColor('#999999'))
    cv.drawCentredString(sig_x+2.75*cm, sig_y-65, "Signature et cachet officiel")

    # Cachet rond
    cx, cy = sig_x+2.75*cm, sig_y-40
    cv.setStrokeColor(VERT_MMI)
    cv.setLineWidth(1.5)
    cv.circle(cx, cy, 1.3*cm, fill=0, stroke=1)
    cv.setLineWidth(0.8)
    cv.circle(cx, cy, 1.1*cm, fill=0, stroke=1)
    cv.setFillColor(VERT_MMI)
    cv.setFont("Helvetica-Bold", 4.5)
    cv.drawCentredString(cx, cy+5, "MINISTÈRE DES MINES")
    cv.drawCentredString(cx, cy-2, "ET DE L'INDUSTRIE")
    cv.drawCentredString(cx, cy-9, "MAURITANIE - 2025")

    # ══════════════════════════════════════════════════════════
    # PIED DE PAGE
    # ══════════════════════════════════════════════════════════
    fy = 2.8*cm
    cv.setStrokeColor(OR)
    cv.setLineWidth(2)
    cv.line(1.5*cm, fy+0.8*cm, W-1.5*cm, fy+0.8*cm)

    cv.setFont("Helvetica", 6.5)
    cv.setFillColor(colors.HexColor('#555555'))
    exp_txt = f"Expire le : {date_exp}" if date_exp else "Sans date d'expiration"
    cv.drawCentredString(W/2, fy+0.45*cm, f"{exp_txt}     |     Émis par : Direction Générale de l'Industrie")
    cv.drawCentredString(W/2, fy+0.15*cm, f"Vérification : {verify_url}")
    cv.setFillColor(ROUGE)
    cv.setFont("Helvetica-Bold", 5.5)
    cv.drawCentredString(W/2, fy-0.1*cm,
        "Document officiel — Toute falsification est passible de poursuites judiciaires.")

    # Numéro de page
    cv.setFillColor(colors.HexColor('#AAAAAA'))
    cv.setFont("Helvetica", 6.5)
    cv.drawRightString(W-1.5*cm, 1.4*cm, "1/1")

    # Bande verte bas de page
    cv.setFillColor(VERT_FONCE)
    cv.rect(0, 0, W, 1.1*cm, fill=1, stroke=0)
    cv.setFillColor(OR)
    cv.rect(0, 1.1*cm, W, 2.5, fill=1, stroke=0)

    cv.save()
    return output_path

