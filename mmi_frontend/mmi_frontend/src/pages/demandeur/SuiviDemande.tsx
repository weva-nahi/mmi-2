import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, FileText, Download, CheckCircle, XCircle, AlertTriangle, CreditCard, Upload } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import StatusBadge from '@/components/ui/StatusBadge'

export default function SuiviDemande() {
  const { id } = useParams()
  const [demande, setDemande] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [quittanceFile, setQuittanceFile] = useState<File | null>(null)
  const [uploadingQ, setUploadingQ]       = useState(false)

  useEffect(() => {
    if (!id) return
    demandesAPI.get(Number(id))
      .then(r => setDemande(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const uploadQuittance = async () => {
    if (!quittanceFile || !demande) return
    setUploadingQ(true)
    try {
      const fd = new FormData()
      fd.append('fichier', quittanceFile)
      await demandesAPI.uploadPiece(demande.id, fd)
      const toast = (await import('react-hot-toast')).default
      toast.success('Quittance déposée avec succès')
      setQuittanceFile(null)
    } catch {
      const toast = (await import('react-hot-toast')).default
      toast.error('Erreur lors du dépôt')
    } finally {
      setUploadingQ(false)
    }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!demande) return (
    <div className="p-6 text-center text-gray-400">
      <FileText size={40} className="mx-auto mb-3 opacity-30" />
      <p>Demande introuvable</p>
    </div>
  )

  const documentsValides = demande.documents_generes?.filter((d: any) => d.signe) || []

  // Calcul progression
  const ETAPES_ORDRE = [
    'SOUMISE','EN_RECEPTION','TRANSMISE_SG','EN_INSTRUCTION_DGI',
    'EN_TRAITEMENT_DDPI','ARRETE_EN_COURS','SIGNATURE_DGI','SIGNATURE_MMI','VALIDE'
  ]
  const idx = ETAPES_ORDRE.indexOf(demande.statut)
  const progression = demande.statut === 'VALIDE' ? 100 :
                      demande.statut === 'REJETE' ? 0 :
                      Math.round(((idx + 1) / ETAPES_ORDRE.length) * 100)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/demandeur/demandes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green">
          <ArrowLeft size={16} /> Mes demandes
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-bold text-mmi-green">{demande.numero_ref}</span>
      </div>

      {/* Statut + progression */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Statut actuel</p>
            <StatusBadge statut={demande.statut} />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Soumise le</p>
            <p className="text-sm font-medium">
              {new Date(demande.date_soumission).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Barre progression */}
        {demande.statut !== 'REJETE' && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progression</span>
              <span className="font-medium">{progression}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progression}%`, background: 'linear-gradient(90deg, #1B6B30, #2E8B45)' }}
              />
            </div>
          </div>
        )}

        {demande.statut === 'REJETE' && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <XCircle size={16} />
              Demande rejetée
            </div>
            {demande.etapes?.find((e: any) => e.etape_code === 'DDPI_REJET')?.commentaire && (
              <div className="bg-white border border-red-200 rounded-lg p-3 text-xs text-gray-700 mb-3">
                <p className="font-semibold text-red-600 mb-1">Motif du rejet :</p>
                <p className="italic">"{demande.etapes.find((e: any) => e.etape_code === 'DDPI_REJET').commentaire}"</p>
              </div>
            )}
            <p className="text-xs text-red-600 mb-2">
              Vous pouvez déposer une nouvelle demande ou contacter la DDPI pour contester cette décision.
            </p>
            <div className="flex gap-2 mt-3">
              <Link to="/demandeur/nouvelle"
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                Nouvelle demande
              </Link>
              <a href="mailto:contact-mmi@mmi.gov.mr"
                 className="text-xs bg-white border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Contacter la DDPI
              </a>
            </div>
          </div>
        )}

        {demande.statut === 'DOSSIER_INCOMPLET' && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm mb-2">
              <AlertTriangle size={16} />
              Dossier incomplet — Action requise
            </div>
            <p className="text-xs text-orange-600 mb-3">
              Votre dossier présente des pièces manquantes ou des informations insuffisantes.
              Vous avez reçu un email détaillant les éléments à fournir.
            </p>
            {/* Afficher le motif de la dernière étape DDPI_INCOMPLET */}
            {demande.etapes?.find((e: any) => e.etape_code === 'DDPI_INCOMPLET')?.commentaire && (
              <div className="bg-white border border-orange-200 rounded-lg p-3 text-xs text-gray-700">
                <p className="font-semibold text-orange-700 mb-1">Motif communiqué par la DDPI :</p>
                <p className="italic">"{demande.etapes.find((e: any) => e.etape_code === 'DDPI_INCOMPLET').commentaire}"</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-orange-200">
              <p className="text-xs text-orange-600">
                📧 Un email a été envoyé à votre adresse de contact. Vérifiez aussi vos spams.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                📞 DDPI : 00 222 43 45 11 00
              </p>
            </div>
          </div>
        )}

        {/* Quittance de paiement requise */}
        {demande.statut === 'ATTENTE_QUITTANCE' && (
          <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
              <CreditCard size={16} /> Quittance de paiement requise
            </div>
            <p className="text-xs text-amber-600 mb-3">
              Le comité BP a approuvé votre demande. Veuillez déposer la quittance de paiement
              des frais d'autorisation pour finaliser votre dossier.
            </p>
            <div className="space-y-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer
                ${quittanceFile ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-400'}`}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.png"
                       onChange={e => setQuittanceFile(e.target.files?.[0] || null)} />
                <Upload size={16} className={quittanceFile ? 'text-amber-600' : 'text-gray-400'} />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {quittanceFile ? quittanceFile.name : 'Choisir la quittance (PDF, JPG, PNG)'}
                  </p>
                  <p className="text-xs text-gray-400">Scan ou photo de la quittance de paiement</p>
                </div>
              </label>
              {quittanceFile && (
                <button onClick={uploadQuittance} disabled={uploadingQ}
                        className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center
                                   justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60">
                  {uploadingQ
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Upload size={14} /> Déposer la quittance</>
                  }
                </button>
              )}
            </div>
          </div>
        )}

        {demande.statut === 'VALIDE' && (
          <div className="mt-3 bg-green-50 border border-mmi-green rounded-xl p-4">
            <div className="flex items-center gap-2 text-mmi-green font-bold text-sm mb-2">
              <CheckCircle size={16} /> Autorisation délivrée !
            </div>
            {demande.autorisation && (
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <p className="text-green-700">Numéro d'autorisation</p>
                  <p className="font-bold text-mmi-green font-mono">{demande.autorisation.numero_auto}</p>
                </div>
                <div>
                  <p className="text-green-700">Date de délivrance</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(demande.autorisation.date_delivrance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-green-700">Date d'expiration</p>
                  <p className="font-semibold text-gray-800">
                    {demande.autorisation.date_expiration
                      ? new Date(demande.autorisation.date_expiration).toLocaleDateString('fr-FR')
                      : <span className="text-blue-600 italic">Sans expiration (extension)</span>
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informations dossier */}
      <div className="card p-6 mb-5">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm">Informations du dossier</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Type', demande.type_demande?.libelle],
            ['Établissement', demande.raison_sociale],
            ['Activité', demande.activite],
            ['Wilaya', demande.wilaya],
          ].map(([k, v]) => (
            <div key={k as string}>
              <p className="text-xs text-gray-400">{k}</p>
              <p className="font-medium text-gray-800">{v}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> Adresse</p>
            <p className="font-medium text-gray-800">{demande.adresse}</p>
          </div>
          {demande.latitude && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">GPS</p>
              <p className="font-mono text-sm">{demande.latitude}, {demande.longitude}</p>
            </div>
          )}
        </div>
      </div>

      {/* Autorisation téléchargeable */}
      {demande.statut === 'VALIDE' && demande.autorisation && (
        <div className="card p-6 mb-5 border-2 border-mmi-green">
          <h3 className="font-semibold text-mmi-green mb-4 text-sm flex items-center gap-2">
            <Download size={16} /> Télécharger votre autorisation
          </h3>
          <div className="space-y-2">
            {/* Autorisation officielle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-mmi-green bg-mmi-green-lt">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-mmi-green rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-mmi-green">
                    Autorisation N° {demande.autorisation.numero_auto}
                  </p>
                  <p className="text-xs text-gray-500">
                    Délivrée le {new Date(demande.autorisation.date_delivrance).toLocaleDateString('fr-FR')}
                    {demande.autorisation.date_expiration && ` — Expire le ${new Date(demande.autorisation.date_expiration).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-mmi-green text-white px-2 py-1 rounded-full font-medium">Active</span>
            </div>

            {/* Documents PDF signés */}
            {documentsValides.map((doc: any) => (
              <a key={doc.id} href={doc.fichier_pdf} target="_blank" rel="noreferrer"
                 className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-mmi-green hover:bg-mmi-green-lt transition-colors">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-mmi-green" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.type_doc}</p>
                    <p className="text-xs text-gray-400">
                      Signé le {new Date(doc.date_signature).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Download size={15} className="text-mmi-green" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          Historique du dossier
        </h3>
        {demande.etapes?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Aucune action enregistrée</p>
        ) : (
          <div className="space-y-0">
            {demande.etapes?.map((etape: any, i: number) => (
              <div key={etape.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-mmi-green-lt border-2 border-mmi-green flex items-center justify-center flex-shrink-0">
                    <Clock size={12} className="text-mmi-green" />
                  </div>
                  {i < demande.etapes.length - 1 && <div className="w-0.5 h-8 bg-gray-200 my-1" />}
                </div>
                <div className="pb-5 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{etape.action}</p>
                      <p className="text-xs text-gray-500">{etape.acteur_nom}</p>
                      {etape.commentaire && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1 italic">
                          "{etape.commentaire}"
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {new Date(etape.date_action).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge statut={etape.statut_avant} />
                    <span className="text-gray-400 text-xs">→</span>
                    <StatusBadge statut={etape.statut_apres} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}