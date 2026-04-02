import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, User, FileText, Send, CheckCircle, XCircle, MapPin, Download, ExternalLink , Paperclip, Upload } from 'lucide-react'
import { demandesAPI } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import StatusBadge from '@/components/ui/StatusBadge'
import toast from 'react-hot-toast'

interface Etape {
  id: number
  etape_code: string
  statut_avant: string
  statut_apres: string
  action: string
  commentaire: string
  date_action: string
  acteur_nom: string
  acteur_role: string[]
}

interface Demande {
  id: number
  numero_ref: string
  statut: string
  raison_sociale: string
  activite: string
  adresse: string
  wilaya: string
  latitude: number | null
  longitude: number | null
  type_demande: { code: string; libelle: string }
  demandeur: { nom: string; prenom: string; email: string; telephone: string; nom_entreprise: string }
  pieces_jointes: any[]
  etapes: Etape[]
  date_soumission: string
}

interface Props {
  backLink: string
  backLabel: string
  actionsDisponibles: {
    etape_code: string
    label: string
    action: string
    color: 'green' | 'red' | 'blue' | 'yellow'
    icon: any
  }[]
}

export default function DossierDetail({ backLink, backLabel, actionsDisponibles }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentaire, setCommentaire] = useState('')
  const [pieceJointe, setPieceJointe]   = useState<File | null>(null)
  const [transmitting, setTransmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info'|'pieces'|'historique'>('info')

  useEffect(() => {
    if (!id) return
    demandesAPI.get(Number(id))
      .then(r => setDemande(r.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAction = async (etape_code: string, action: string) => {
    if (!demande) return

    // Commentaire obligatoire pour rejet et dossier incomplet
    if (['DDPI_INCOMPLET', 'DDPI_REJET'].includes(etape_code) && !commentaire.trim()) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error('Le motif est obligatoire pour cette action — le demandeur en sera informé.')
      )
      return
    }

    setTransmitting(true)
    try {
      // Joindre une pièce si présente
      if (pieceJointe) {
        const fd = new FormData()
        fd.append('fichier', pieceJointe)
        await demandesAPI.uploadPieceAgent(demande.id, fd).catch(() => {})
      }
      // MMI_SIGNATURE → validerFinal (délivre l'autorisation)
      if (etape_code === 'MMI_SIGNATURE') {
        await demandesAPI.validerFinal(demande.id, commentaire)
      } else {
        await demandesAPI.transmettre(demande.id, {
          etape_code,
          action,
          commentaire,
        })
      }
      toast.success('Action effectuée avec succès')
      // Recharger
      const r = await demandesAPI.get(demande.id)
      setDemande(r.data)
      setCommentaire('')
      setPieceJointe(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la transition')
    } finally {
      setTransmitting(false)
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
      <p>Dossier introuvable</p>
    </div>
  )

  const btnColors: Record<string, string> = {
    green:  'bg-mmi-green text-white hover:bg-mmi-green-mid',
    red:    'bg-red-600 text-white hover:bg-red-700',
    blue:   'bg-blue-600 text-white hover:bg-blue-700',
    yellow: 'bg-amber-500 text-white hover:bg-amber-600',
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={backLink} className="flex items-center gap-2 text-sm text-gray-500 hover:text-mmi-green transition-colors">
          <ArrowLeft size={16} /> {backLabel}
        </Link>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-mmi-green text-lg">{demande.numero_ref}</span>
          <StatusBadge statut={demande.statut} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">

          {/* Onglets */}
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { key: 'info',      label: 'Informations' },
              { key: 'pieces',    label: `Pièces (${demande.pieces_jointes.length})` },
              { key: 'historique', label: `Historique (${demande.etapes.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${activeTab === tab.key
                    ? 'border-mmi-green text-mmi-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Infos */}
          {activeTab === 'info' && (
            <div className="card p-6 space-y-4 animate-fadeInUp">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Type de demande</p>
                  <p className="font-medium text-gray-800">{demande.type_demande.libelle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Date de soumission</p>
                  <p className="font-medium text-gray-800">
                    {new Date(demande.date_soumission).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Établissement</p>
                  <p className="font-medium text-gray-800">{demande.raison_sociale}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Activité</p>
                  <p className="font-medium text-gray-800">{demande.activite}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin size={11} /> Adresse</p>
                  <p className="text-gray-700">{demande.adresse} — {demande.wilaya}</p>
                </div>
                {demande.latitude && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Coordonnées GPS</p>
                    <p className="font-mono text-sm text-gray-700">
                      {demande.latitude?.toFixed(6)}, {demande.longitude?.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><User size={11} /> Demandeur</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Nom</p>
                    <p className="font-medium">{demande.demandeur.nom} {demande.demandeur.prenom}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Entreprise</p>
                    <p className="font-medium">{demande.demandeur.nom_entreprise}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="text-mmi-green">{demande.demandeur.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Téléphone</p>
                    <p>{demande.demandeur.telephone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pièces jointes */}
          {activeTab === 'pieces' && (
            <div className="card p-6 animate-fadeInUp">
              {demande.pieces_jointes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Aucune pièce jointe</p>
              ) : (
                <div className="space-y-2">
                  {demande.pieces_jointes.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-mmi-green" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.nom_original}</p>
                          <p className="text-xs text-gray-400">{p.piece_requise_nom} · {p.taille_ko} Ko</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge statut={p.statut} />
                        <a href={p.fichier} target="_blank" rel="noreferrer"
                           className="text-mmi-green hover:text-mmi-green-mid">
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historique */}
          {activeTab === 'historique' && (
            <div className="card p-6 animate-fadeInUp">
              <div className="space-y-0">
                {demande.etapes.map((etape, i) => (
                  <div key={etape.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-mmi-green-lt border-2 border-mmi-green flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-mmi-green" />
                      </div>
                      {i < demande.etapes.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="pb-6 flex-1">
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
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
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
            </div>
          )}
        </div>

        {/* Colonne actions */}
        <div className="space-y-4">
          {/* Raccourcis formulaires DDPI */}
          {demande.statut && ['EN_TRAITEMENT_DDPI','VISITE_PROGRAMMEE','EN_COMMISSION_BP','ACCORD_PRINCIPE'].includes(demande.statut) && (
            <div className="card p-5">
              <p className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <ExternalLink size={14} className="text-mmi-green" />
                Formulaires DDPI
              </p>
              <div className="space-y-2">
                {(demande.statut === 'VISITE_PROGRAMMEE' || demande.statut === 'EN_TRAITEMENT_DDPI') && (
                  <Link to={`/ddpi/visite/${id}`}
                        className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors">
                    <ExternalLink size={12} /> PV de visite des lieux
                  </Link>
                )}
                {(demande.statut === 'EN_COMMISSION_BP' || demande.statut === 'VISITE_PROGRAMMEE') && (
                  <Link to={`/ddpi/comite-bp/${id}`}
                        className="flex items-center gap-2 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors">
                    <ExternalLink size={12} /> Réunion Comité BP
                  </Link>
                )}
                {demande.type_demande?.code === 'BP' && (
                  <Link to={`/ddpi/distance/${id}`}
                        className="flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors">
                    <ExternalLink size={12} /> Vérifier distance 500m
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Panel statut */}
          <div className="card p-5">
            <p className="text-xs text-gray-400 mb-2">Statut actuel</p>
            <StatusBadge statut={demande.statut} />
          </div>

          {/* Actions disponibles */}
          {actionsDisponibles.length > 0 && (
            <div className="card p-5">
              <p className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
                <Send size={15} className="text-mmi-green" />
                Actions
              </p>

              <div className="mb-3">
                <label className="form-label text-xs">
                  Commentaire / annotation
                  {['DDPI_INCOMPLET','DDPI_REJET'].some(c =>
                    actionsDisponibles.some(a => a.etape_code === c)
                  ) && <span className="text-red-500 ml-1">* obligatoire pour rejet/incomplet</span>}
                </label>
                <textarea
                  className="form-input text-sm resize-none"
                  rows={3}
                  placeholder="Observations, motif, instructions — ce texte sera transmis au demandeur..."
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ce commentaire sera visible par le demandeur et inclus dans la notification email.
                </p>
                {/* Pièce jointe optionnelle par agent */}
                <div className="mt-3">
                  <label className="form-label text-xs flex items-center gap-1.5">
                    <Paperclip size={12} /> Pièce jointe (optionnel)
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed
                    cursor-pointer transition-all mt-1
                    ${pieceJointe ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
                    <input type="file" className="hidden"
                           accept=".pdf,.jpg,.png,.doc,.docx"
                           onChange={e => setPieceJointe(e.target.files?.[0] || null)} />
                    <Upload size={14} className={pieceJointe ? 'text-mmi-green' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate max-w-[180px]">
                      {pieceJointe ? pieceJointe.name : 'Joindre un document...'}
                    </span>
                    {pieceJointe && (
                      <button type="button"
                              onClick={e => { e.preventDefault(); setPieceJointe(null) }}
                              className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </label>
                </div>

              {/* Pièce jointe optionnelle */}
              <div className="mt-3">
                <label className="form-label text-xs flex items-center gap-1">
                  <Paperclip size={12} /> Pièce jointe (optionnel)
                </label>
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed
                  cursor-pointer transition-all mt-1
                  ${pieceJointe ? 'border-mmi-green bg-mmi-green-lt' : 'border-gray-200 hover:border-mmi-green'}`}>
                  <input type="file" className="hidden"
                         accept=".pdf,.jpg,.png,.doc,.docx"
                         onChange={e => setPieceJointe(e.target.files?.[0] || null)} />
                  <Upload size={14} className={pieceJointe ? 'text-mmi-green' : 'text-gray-400'} />
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {pieceJointe ? pieceJointe.name : 'Joindre un document...'}
                  </span>
                  {pieceJointe && (
                    <button type="button"
                            onClick={e => { e.preventDefault(); setPieceJointe(null) }}
                            className="ml-auto text-red-400 hover:text-red-600 text-xs">✕</button>
                  )}
                </label>
              </div>
              </div>

              <div className="space-y-2">
                {actionsDisponibles.map(action => (
                  <button
                    key={action.etape_code}
                    onClick={() => handleAction(action.etape_code, action.action)}
                    disabled={transmitting}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                      transition-all disabled:opacity-50 ${btnColors[action.color]}`}
                  >
                    {transmitting
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <action.icon size={15} />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}