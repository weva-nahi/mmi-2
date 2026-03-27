import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileSignature, CheckCircle, Clock, Award, Download,
         ArrowLeft, Calendar, Hash, Building2 } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import AgentLayout from './AgentLayout'
import DossiersList from './DossiersList'
import DossierDetail from './DossierDetail'
import StatusBadge from '@/components/ui/StatusBadge'
import toast from 'react-hot-toast'

const MMI_MENU = [
  { to: '/mmi',          icon: FileSignature, label: 'Tableau de bord'    },
  { to: '/mmi/dossiers', icon: Clock,         label: 'Arrêtés à signer'  },
  { to: '/mmi/signes',   icon: CheckCircle,   label: 'Arrêtés signés'    },
]

export function MMILayout() {
  return <AgentLayout titre="MMI — Signature des arrêtés" couleur="#1B6B30" menu={MMI_MENU} />
}

export function MMIDashboard() {
  const [counts, setCounts] = useState({ attente:0, signes:0, total:0 })
  useEffect(() => {
    Promise.all([
      demandesAPI.list({ statut:'SIGNATURE_MMI' }),
      demandesAPI.list({ statut:'VALIDE' }),
    ]).then(([a,b]) => setCounts({
      attente: (a.data.results||a.data).length,
      signes:  (b.data.results||b.data).length,
      total:   (a.data.results||a.data).length + (b.data.results||b.data).length,
    })).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-1">MMI — Signature des arrêtés</h1>
      <p className="text-sm text-gray-500 mb-6">
        Signature officielle des arrêtés industriels — Étape finale du circuit
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'En attente de signature', value:counts.attente, color:'text-amber-600',  bg:'bg-amber-50',  icon:Clock,         link:'/mmi/dossiers' },
          { label:'Arrêtés signés',          value:counts.signes,  color:'text-green-600',  bg:'bg-green-50',  icon:CheckCircle,   link:'/mmi/signes'   },
          { label:'Total traités',           value:counts.total,   color:'text-blue-600',   bg:'bg-blue-50',   icon:Award,         link:null            },
        ].map(s => (
          <div key={s.label} className={`card p-5 ${s.link ? 'hover:shadow-md cursor-pointer' : ''}`}
               onClick={() => s.link && (window.location.href = s.link)}>
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 border-l-4 border-mmi-green">
        <h3 className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-2">
          <Award size={15} className="text-mmi-green" /> Rôle du Signataire MMI
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          En tant que Signataire MMI, vous apposez la signature officielle finale sur les arrêtés
          (BP, eau minérale, unité industrielle, renouvellement, extension).
          Après votre signature, l'autorisation est générée automatiquement et mise à disposition
          du demandeur dans son espace personnel.
        </p>
      </div>
    </div>
  )
}

export function MMIDossiers() {
  return <DossiersList titre="Arrêtés en attente de signature — MMI"
                       statutsFiltres={['SIGNATURE_MMI','ARRETE_EN_COURS']}
                       linkBase="/mmi/dossier" />
}

export function MMISignes() {
  return <DossiersList titre="Arrêtés signés — Autorisations délivrées"
                       statutsFiltres={['VALIDE']}
                       linkBase="/mmi/dossier" />
}

export function MMIDossier() {
  const { id } = useParams()
  const [demande, setDemande]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [signing, setSigning]   = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const load = () => {
    if (!id) return
    demandesAPI.get(Number(id))
      .then(r => setDemande(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleSignature = async () => {
    if (!id) return
    setSigning(true)
    try {
      const res = await demandesAPI.validerFinal(Number(id), commentaire)
      toast.success(`✅ Arrêté signé ! Autorisation N° ${res.data.numero_auto} délivrée.`)
      setShowConfirm(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la signature')
    } finally {
      setSigning(false)
    }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!demande) return (
    <div className="p-6 text-center text-gray-400">Dossier introuvable</div>
  )

  const isValide    = demande.statut === 'VALIDE'
  const canSign     = ['SIGNATURE_MMI','ARRETE_EN_COURS'].includes(demande.statut)
  const autorisation = demande.autorisation

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/mmi/dossiers"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-mmi-green">
          <ArrowLeft size={16} /> Arrêtés à signer
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono font-bold text-mmi-green">{demande.numero_ref}</span>
        <StatusBadge statut={demande.statut} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Colonne gauche — Infos dossier */}
        <div className="lg:col-span-2 space-y-5">

          {/* Infos demande */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4">Informations du dossier</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Référence',    demande.numero_ref],
                ['Type',         demande.type_demande?.libelle],
                ['Établissement',demande.raison_sociale],
                ['Activité',     demande.activite],
                ['Wilaya',       demande.wilaya],
                ['Demandeur',    demande.demandeur_nom],
              ].map(([k,v]) => (
                <div key={k as string}>
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="font-semibold text-gray-800 text-sm">{v || '—'}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Adresse</p>
                <p className="font-semibold text-gray-800 text-sm">{demande.adresse || '—'}</p>
              </div>
            </div>
          </div>

          {/* Autorisation délivrée */}
          {isValide && autorisation && (
            <div className="card p-5 border-2 border-mmi-green bg-mmi-green-lt">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-mmi-green rounded-full flex items-center justify-center">
                  <Award size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-mmi-green text-sm">Autorisation délivrée</h3>
                  <p className="text-xs text-green-700">Valide et active</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <Hash size={10} /> Numéro
                  </p>
                  <p className="font-bold text-mmi-green font-mono">{autorisation.numero_auto}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Type</p>
                  <p className="font-semibold text-gray-800">{autorisation.type}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <Calendar size={10} /> Délivrée le
                  </p>
                  <p className="font-semibold text-gray-800">
                    {new Date(autorisation.date_delivrance).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Expire le</p>
                  <p className="font-semibold text-gray-800">
                    {autorisation.date_expiration
                      ? new Date(autorisation.date_expiration).toLocaleDateString('fr-FR')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" /> Historique du circuit
            </h3>
            <div className="space-y-0">
              {(demande.etapes || []).map((etape: any, i: number) => (
                <div key={etape.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-mmi-green-lt border-2 border-mmi-green
                                    flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={10} className="text-mmi-green" />
                    </div>
                    {i < (demande.etapes||[]).length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 text-xs">{etape.action}</p>
                        <p className="text-xs text-gray-400">{etape.acteur_nom}</p>
                        {etape.commentaire && (
                          <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1 italic">
                            "{etape.commentaire}"
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap ml-3">
                        {new Date(etape.date_action).toLocaleDateString('fr-FR', {
                          day:'numeric', month:'short'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusBadge statut={etape.statut_avant} />
                      <span className="text-gray-400 text-xs">→</span>
                      <StatusBadge statut={etape.statut_apres} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite — Actions */}
        <div className="space-y-4">

          {/* Panel signature */}
          {canSign && !showConfirm && (
            <div className="card p-5 border-l-4 border-amber-400">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <FileSignature size={15} className="text-amber-500" />
                Signature officielle
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                En signant cet arrêté, vous délivrez officiellement l'autorisation
                industrielle. Le demandeur sera notifié et pourra télécharger son document.
              </p>
              <div className="mb-3">
                <label className="form-label text-xs">Observations (optionnel)</label>
                <textarea
                  className="form-input resize-none text-sm"
                  rows={3}
                  placeholder="Remarques ou conditions particulières..."
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center
                           justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1B6B30, #2E8B45)' }}
              >
                <FileSignature size={16} /> Signer l'arrêté officiel
              </button>
            </div>
          )}

          {/* Confirmation signature */}
          {canSign && showConfirm && (
            <div className="card p-5 border-2 border-amber-400 bg-amber-50">
              <h3 className="font-bold text-amber-700 text-sm mb-3 flex items-center gap-2">
                ⚠️ Confirmer la signature
              </h3>
              <p className="text-xs text-amber-700 mb-4">
                Cette action est <strong>irréversible</strong>. Êtes-vous sûr de vouloir
                signer et délivrer l'autorisation pour <strong>{demande.raison_sociale}</strong> ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSignature}
                  disabled={signing}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center
                             justify-center gap-2 bg-mmi-green hover:bg-green-700 disabled:opacity-60"
                >
                  {signing
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle size={14} /> Confirmer</>
                  }
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 text-sm bg-white
                             border border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Déjà validé */}
          {isValide && (
            <div className="card p-5 bg-green-50 border border-mmi-green">
              <div className="flex items-center gap-2 text-mmi-green font-bold text-sm mb-2">
                <CheckCircle size={16} /> Arrêté signé ✅
              </div>
              <p className="text-xs text-green-700">
                L'autorisation a été délivrée et est disponible pour le demandeur.
              </p>
            </div>
          )}

          {/* Documents générés */}
          {(demande.documents_generes||[]).length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <Download size={14} className="text-mmi-green" /> Documents officiels
              </h3>
              <div className="space-y-2">
                {demande.documents_generes.map((doc: any) => (
                  <a key={doc.id} href={doc.fichier_pdf} target="_blank" rel="noreferrer"
                     className="flex items-center gap-2 p-2.5 rounded-lg border border-mmi-green
                                bg-white hover:bg-mmi-green-lt transition-colors">
                    <FileSignature size={14} className="text-mmi-green flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-mmi-green truncate">{doc.type_doc}</p>
                      {doc.date_signature && (
                        <p className="text-xs text-gray-400">
                          {new Date(doc.date_signature).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <Download size={13} className="text-mmi-green flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}