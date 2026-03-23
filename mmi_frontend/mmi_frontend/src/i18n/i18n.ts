import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  fr: {
    translation: {
      nav: {
        portail: "Portail de l'industrie",
        autorisations: "Gestion des autorisations",
        pmne: "PMNE",
        contact: "Contact",
      },
      home: {
        title: "وزارة المعادن والصناعة",
        subtitle: "MINISTÈRE DES MINES ET DE L'INDUSTRIE",
        dgi: "Direction Générale de l'Industrie",
        actualites: "Actualités",
        actualites_sub: "Restez informé des dernières nouvelles du secteur industriel",
        carto_title: "Cartographie des unités industrielles",
      },
      auth: {
        connexion: "Connexion",
        inscription: "Créer un compte",
        identifiant: "Identifiant unique",
        mot_de_passe: "Mot de passe",
        confirmer: "Confirmer le mot de passe",
        email: "Email",
        email_recup: "Email de récupération",
        nom_entreprise: "Nom de l'entreprise",
        forme_juridique: "Forme juridique",
        nif: "NIF",
        adresse: "Adresse du siège",
        nom: "Nom",
        prenom: "Prénom",
        telephone: "Téléphone",
        se_connecter: "Se connecter",
        creer_compte: "Créer mon compte",
        identifiant_hint: "Format : MMI-DEM-XXXXX reçu par email",
      },
      demandes: {
        nouvelle: "Nouvelle demande",
        mes_demandes: "Mes demandes",
        suivi: "Suivi du dossier",
        ref: "Référence",
        statut: "Statut",
        type: "Type",
        date: "Date",
        soumettre: "Soumettre la demande",
      },
      statuts: {
        SOUMISE: "Soumise",
        EN_RECEPTION: "En réception",
        TRANSMISE_SG: "Transmise au SG",
        EN_LECTURE_SG: "En lecture SG",
        EN_INSTRUCTION_DGI: "En instruction DGI",
        EN_TRAITEMENT_DDPI: "En traitement DDPI",
        DOSSIER_INCOMPLET: "Dossier incomplet",
        VISITE_PROGRAMMEE: "Visite programmée",
        VALIDE: "Validée",
        REJETE: "Rejetée",
      },
    }
  },
  en: {
    translation: {
      nav: {
        portail: "Industry Portal",
        autorisations: "Authorization Management",
        pmne: "PMNE",
        contact: "Contact",
      },
      home: {
        title: "وزارة المعادن والصناعة",
        subtitle: "MINISTRY OF MINES AND INDUSTRY",
        dgi: "General Directorate of Industry",
        actualites: "News",
        actualites_sub: "Stay informed about the latest industrial sector news",
        carto_title: "Industrial Units Map",
      },
      auth: {
        connexion: "Login",
        inscription: "Create Account",
        identifiant: "Unique identifier",
        mot_de_passe: "Password",
        se_connecter: "Sign in",
        creer_compte: "Create account",
        identifiant_hint: "Format: MMI-DEM-XXXXX received by email",
      },
    }
  },
  ar: {
    translation: {
      nav: {
        portail: "بوابة الصناعة",
        autorisations: "إدارة التراخيص",
        pmne: "PMNE",
        contact: "اتصل بنا",
      },
      home: {
        title: "وزارة المعادن والصناعة",
        subtitle: "وزارة المعادن والصناعة",
        dgi: "المديرية العامة للصناعة",
        actualites: "الأخبار",
        actualites_sub: "ابق على اطلاع بآخر أخبار القطاع الصناعي",
        carto_title: "خريطة الوحدات الصناعية",
      },
      auth: {
        connexion: "تسجيل الدخول",
        inscription: "إنشاء حساب",
        identifiant: "المعرف الفريد",
        mot_de_passe: "كلمة المرور",
        se_connecter: "تسجيل الدخول",
        creer_compte: "إنشاء حسابي",
        identifiant_hint: "الصيغة: MMI-DEM-XXXXX مستلمة عبر البريد الإلكتروني",
      },
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n
