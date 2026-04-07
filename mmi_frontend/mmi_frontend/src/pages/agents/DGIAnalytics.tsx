import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import {
  Download, FileSpreadsheet, FileText, RefreshCw, Search,
  Filter, TrendingUp, Users, CheckCircle, Clock, XCircle,
  Building2, MapPin, ChevronDown, Eye
} from 'lucide-react'
import { analyticsAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const COLORS = ['#1B6B30','#2E8B45','#4CAF6F','#F97316','#3B82F6','#7C3AED','#EF4444','#F59E0B']

interface KPIs {
  total_demandes: number
  en_cours: number
  valides_annee: number
  rejetes: number
  autorisations_actives: number
  en_instruction_dgi: number
  en_attente_signature: number
}

interface Renouvellement {
  id: number
  numero_ref: string
  raison_sociale: string
  statut_demande: string
  wilaya: string
  activite: string
  date_soumission: string
  abreviation: string
  nationalite_entreprise: string
  nom_responsable: string
  nni_passeport: string
  telephone_responsable: string
  forme_juridique: string
  registre_commerce: string
  nif_numero: string
  cnss_numero: string
  numero_enregistrement: string
  date_creation: string
  date_debut_production: string
  emplois_crees: number
  employes_administratifs: number
  techniciens: number
  ouvriers: number
  description_unite: string
  capital_social: string
  capacite_tonnes_an: number
  capacite_tonnes_jour: number
  varietes_production: string
  difficultes: any
}

export default function DGIAnalytics() {
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState<'csv'|'excel'|null>(null)
  const [search, setSearch]     = useState('')
  const [filterWilaya, setFilterWilaya]   = useState('')
  const [filterStatut, setFilterStatut]   = useState('')
  const [selectedRow, setSelectedRow]     = useState<Renouvellement | null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'renouvellements'>('overview')

  const load = () => {
    setLoading(true)
    analyticsAPI.dgi()
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => { toast.error('Erreur chargement analytics'); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleExportDemandes = async () => {
    try {
      const res = await analyticsAPI.exportDemandes()
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'demandes_mmi.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export Excel téléchargé !')
    } catch {
      toast.error("Erreur lors de l'export")
    }
  }

  const handleExportPDF = () => {
    // Export PDF via impression navigateur — génère un PDF de la page visible
    const style = document.createElement('style')
    style.textContent = '@media print { .no-print { display: none !important; } thead { background: #1B6B30 !important; -webkit-print-color-adjust: exact; } }'
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.head.removeChild(style), 1000)
  }

  const handleExport = async (fmt: 'csv' | 'excel') => {
    setExporting(fmt)
    try {
      const params: any = {}
      if (filterWilaya) params.wilaya = filterWilaya
      if (filterStatut) params.statut = filterStatut
      const fn = fmt === 'csv' ? analyticsAPI.exportCSV : analyticsAPI.exportExcel
      const res = await fn(params)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = fmt === 'csv' ? 'renouvellements_mmi.csv' : 'renouvellements_mmi.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Export ${fmt.toUpperCase()} téléchargé !`)
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(null)
    }
  }

  if (loading) return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (!data) return null

  const { kpis, par_type, par_wilaya, par_mois, par_statut, renouvellements, renouv_stats } = data

  // Filtrer les renouvellements
  const renouv_filtres = (renouvellements as Renouvellement[]).filter(r => {
    const matchSearch = !search ||
      r.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
      r.numero_ref.toLowerCase().includes(search.toLowerCase()) ||
      r.nom_responsable.toLowerCase().includes(search.toLowerCase()) ||
      r.activite.toLowerCase().includes(search.toLowerCase())
    const matchWilaya = !filterWilaya || r.wilaya === filterWilaya
    const matchStatut = !filterStatut || r.statut_demande === filterStatut
    return matchSearch && matchWilaya && matchStatut
  })

  const wilayas_uniques = [...new Set((renouvellements as Renouvellement[]).map(r => r.wilaya).filter(Boolean))]
  const statuts_uniques = [...new Set((renouvellements as Renouvellement[]).map(r => r.statut_demande).filter(Boolean))]

  const STATUT_LABELS: Record<string, string> = {
    SOUMISE:'Soumise', EN_RECEPTION:'En réception', TRANSMISE_SG:'Transmise SG',
    EN_INSTRUCTION_DGI:'En instruction DGI', VALIDE:'Validée', REJETE:'Rejetée',
    DOSSIER_INCOMPLET:'Incomplet',
  }

  return (
    <div className="p-6 max-w-full">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tableau de bord analytique — DGI</h1>
          <p className="text-sm text-gray-500 mt-0.5">Direction Générale de l'Industrie</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF}
                    className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
              <Download size={14} /> PDF
            </button>
            <button onClick={() => handleExportDemandes()}
                    className="flex items-center gap-1.5 text-sm text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button onClick={load}
                    className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'overview',        label: '📊 Vue générale' },
          { key: 'renouvellements', label: '🔄 Renouvellements' },
        ].map(tab => (
          <button key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${activeTab === tab.key ? 'bg-white shadow-sm text-mmi-green' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          ONGLET 1 — Vue générale
      ════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeInUp">

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label:'Total demandes',       value: kpis.total_demandes,        icon: FileText,    color:'text-gray-700',  bg:'bg-gray-50'  },
              { label:'En cours',             value: kpis.en_cours,              icon: Clock,       color:'text-amber-600', bg:'bg-amber-50' },
              { label:'Validées cette année', value: kpis.valides_annee,         icon: CheckCircle, color:'text-green-600', bg:'bg-green-50' },
              { label:'Autorisations actives',value: kpis.autorisations_actives, icon: Building2,   color:'text-blue-600',  bg:'bg-blue-50'  },
              { label:'En instruction DGI',   value: kpis.en_instruction_dgi,    icon: TrendingUp,  color:'text-purple-600',bg:'bg-purple-50'},
              { label:'À signer',             value: kpis.en_attente_signature,  icon: FileSpreadsheet,color:'text-orange-600',bg:'bg-orange-50'},
              { label:'Rejetées',             value: kpis.rejetes,               icon: XCircle,     color:'text-red-600',   bg:'bg-red-50'   },
              { label:'Total renouvellements',value: renouv_stats.total,         icon: RefreshCw,   color:'text-teal-600',  bg:'bg-teal-50'  },
            ].map(k => (
              <div key={k.label} className="card p-4">
                <div className={`w-9 h-9 ${k.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <k.icon size={18} className={k.color} />
                </div>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Évolution mensuelle */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">📈 Évolution des demandes (12 mois)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={par_mois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1B6B30" strokeWidth={2}
                        dot={{ fill: '#1B6B30', r: 4 }} name="Demandes" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Par type */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">🏭 Demandes par type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={par_type} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="type_demande__code" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1B6B30" radius={[0,4,4,0]} name="Total" />
                  <Bar dataKey="valides" fill="#4CAF6F" radius={[0,4,4,0]} name="Validées" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Par statut */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">📊 Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={par_statut} dataKey="count" nameKey="statut"
                       cx="50%" cy="50%" outerRadius={80}
                       label={({ statut, percent }: { statut: string; percent: number }) =>
                         `${STATUT_LABELS[statut] || statut} (${(percent*100).toFixed(0)}%)`}>
                    {par_statut.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number, name: string) => [val, STATUT_LABELS[name] || name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Par wilaya */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">📍 Top wilayas</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={par_wilaya.slice(0,8)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="wilaya" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3B82F6" radius={[0,4,4,0]} name="Demandes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats renouvellement globales */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-4">🔄 Statistiques renouvellements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Total renouvellements" value={renouv_stats.total} />
              <Stat label="Emplois déclarés" value={renouv_stats.total_emplois} />
              {(renouv_stats.par_forme || []).map((f: any) => (
                <Stat key={f.forme_juridique} label={f.forme_juridique || 'Non défini'} value={f.count} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ONGLET 2 — Tableau renouvellements
      ════════════════════════════════════════════════════ */}
      {activeTab === 'renouvellements' && (
        <div className="animate-fadeInUp">

          {/* Barre d'outils */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Recherche */}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="form-input pl-8 text-sm py-2"
                     placeholder="Rechercher entreprise, référence, responsable..."
                     value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filtre wilaya */}
            <select className="form-input text-sm py-2 w-40"
                    value={filterWilaya} onChange={e => setFilterWilaya(e.target.value)}>
              <option value="">Toutes wilayas</option>
              {wilayas_uniques.map(w => <option key={w} value={w}>{w}</option>)}
            </select>

            {/* Filtre statut */}
            <select className="form-input text-sm py-2 w-40"
                    value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              {statuts_uniques.map(s => <option key={s} value={s}>{STATUT_LABELS[s] || s}</option>)}
            </select>

            {/* Exports */}
            <button onClick={() => handleExport('csv')} disabled={!!exporting}
                    className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {exporting === 'csv'
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FileText size={14} />}
              CSV
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting}
                    className="flex items-center gap-1.5 text-sm bg-emerald-700 text-white px-3 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">
              {exporting === 'excel'
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <FileSpreadsheet size={14} />}
              Excel
            </button>
            <button onClick={handleExportPDF} disabled={!!exporting}
                    className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
              <Download size={14} /> PDF
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            {renouv_filtres.length} renouvellement(s) affiché(s)
          </p>

          {/* Tableau */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-mmi-green text-white">
                    {[
                      'N° Réf','Raison Sociale','Wilaya','Activité','Statut',
                      'Responsable','Forme Jur.','NIF','CNSS',
                      'N° Enreg.','Date Création','Emplois',
                      'Capacité (T/an)','Variétés','Actions'
                    ].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renouv_filtres.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="text-center py-12 text-gray-400">
                        <RefreshCw size={28} className="mx-auto mb-2 opacity-30" />
                        <p>Aucun renouvellement trouvé</p>
                      </td>
                    </tr>
                  ) : renouv_filtres.map((r, idx) => (
                    <tr key={r.id}
                        className={`border-b border-gray-50 hover:bg-green-50 transition-colors
                          ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-3 py-2.5 font-mono font-semibold text-mmi-green whitespace-nowrap">
                        {r.numero_ref}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-32 truncate" title={r.raison_sociale}>
                        {r.raison_sociale}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-gray-400" />
                          {r.wilaya || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-28 truncate" title={r.activite}>
                        {r.activite || '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatutBadge statut={r.statut_demande} />
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                        {r.nom_responsable || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                          {r.forme_juridique || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{r.nif_numero || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{r.cnss_numero || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{r.numero_enregistrement || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.date_creation || '—'}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-blue-700">
                        {(r.emplois_crees || 0) + (r.employes_administratifs || 0) + (r.techniciens || 0) + (r.ouvriers || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-700">
                        {r.capacite_tonnes_an ? `${r.capacite_tonnes_an} T` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-24 truncate" title={r.varietes_production}>
                        {r.varietes_production || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setSelectedRow(r)}
                                className="p-1.5 bg-mmi-green-lt text-mmi-green rounded-lg hover:bg-mmi-green hover:text-white transition-all">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détail renouvellement ── */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
             onClick={() => setSelectedRow(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-mmi-green text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <p className="font-bold">{selectedRow.numero_ref}</p>
                <p className="text-sm opacity-80">{selectedRow.raison_sociale}</p>
              </div>
              <button onClick={() => setSelectedRow(null)}
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {[
                { title:'I. Identification', rows:[
                  ['Dénomination',     selectedRow.raison_sociale],
                  ['Abréviation',      selectedRow.abreviation],
                  ['Activité',         selectedRow.activite],
                  ['Wilaya',           selectedRow.wilaya],
                  ['Nationalité',      selectedRow.nationalite_entreprise],
                ]},
                { title:'III. Gestionnaire', rows:[
                  ['Nom responsable',  selectedRow.nom_responsable],
                  ['NNI / Passeport',  selectedRow.nni_passeport],
                  ['Téléphone',        selectedRow.telephone_responsable],
                ]},
                { title:'IV. Environnement juridique', rows:[
                  ['Forme juridique',  selectedRow.forme_juridique],
                  ['RC',               selectedRow.registre_commerce],
                  ['NIF',              selectedRow.nif_numero],
                  ['CNSS',             selectedRow.cnss_numero],
                ]},
                { title:'V. Environnement administratif', rows:[
                  ['N° Enregistrement',selectedRow.numero_enregistrement],
                  ['Date création',    selectedRow.date_creation],
                  ['Début production', selectedRow.date_debut_production],
                  ['Emplois créés',    String(selectedRow.emplois_crees)],
                  ['Admin',            String(selectedRow.employes_administratifs)],
                  ['Techniciens',      String(selectedRow.techniciens)],
                  ['Ouvriers',         String(selectedRow.ouvriers)],
                ]},
                { title:'VI. Environnement économique', rows:[
                  ['Description',      selectedRow.description_unite],
                  ['Capital social',   selectedRow.capital_social],
                  ['Capacité (T/an)',  String(selectedRow.capacite_tonnes_an || '—')],
                  ['Capacité (T/j)',   String(selectedRow.capacite_tonnes_jour || '—')],
                  ['Variétés',         selectedRow.varietes_production],
                ]},
                { title:'VII. Difficultés', rows:[
                  ['Difficultés',      Array.isArray(selectedRow.difficultes)
                    ? selectedRow.difficultes.join(' | ')
                    : String(selectedRow.difficultes || '—')],
                ]},
              ].map(section => (
                <div key={section.title}>
                  <h4 className="font-bold text-mmi-green text-sm mb-2 pb-1 border-b border-green-100">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.rows.map(([k, v]) => (
                      <div key={k as string} className="flex gap-3 text-xs py-1">
                        <span className="text-gray-400 w-36 flex-shrink-0">{k}</span>
                        <span className="font-medium text-gray-800">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composants utilitaires ────────────────────────────────
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-mmi-green">{value ?? 0}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    VALIDE:              { label:'Validée',         cls:'bg-green-100 text-green-700' },
    REJETE:              { label:'Rejetée',          cls:'bg-red-100 text-red-700' },
    SOUMISE:             { label:'Soumise',          cls:'bg-gray-100 text-gray-600' },
    EN_INSTRUCTION_DGI:  { label:'DGI',              cls:'bg-purple-100 text-purple-700' },
    DOSSIER_INCOMPLET:   { label:'Incomplet',        cls:'bg-amber-100 text-amber-700' },
    SIGNATURE_DGI:       { label:'Signature DGI',    cls:'bg-blue-100 text-blue-700' },
    SIGNATURE_MMI:       { label:'Signature MMI',    cls:'bg-indigo-100 text-indigo-700' },
  }
  const s = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}