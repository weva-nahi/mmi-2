const STATUT_MAP: Record<string, { label: string; class: string }> = {
  SOUMISE:              { label: 'Soumise',           class: 'bg-blue-100 text-blue-800' },
  EN_RECEPTION:         { label: 'En réception',      class: 'bg-blue-100 text-blue-700' },
  TRANSMISE_SG:         { label: 'Transmise SG',      class: 'bg-purple-100 text-purple-700' },
  EN_LECTURE_SG:        { label: 'Lecture SG',        class: 'bg-purple-100 text-purple-700' },
  TRANSMISE_MINISTRE:   { label: 'Transmise Ministre',class: 'bg-indigo-100 text-indigo-700' },
  EN_LECTURE_MINISTRE:  { label: 'Lecture Ministre',  class: 'bg-indigo-100 text-indigo-700' },
  EN_INSTRUCTION_DGI:   { label: 'Instruction DGI',   class: 'bg-yellow-100 text-yellow-700' },
  EN_TRAITEMENT_DDPI:   { label: 'Traitement DDPI',   class: 'bg-orange-100 text-orange-700' },
  DOSSIER_INCOMPLET:    { label: 'Incomplet',         class: 'bg-red-100 text-red-700' },
  VISITE_PROGRAMMEE:    { label: 'Visite programmée', class: 'bg-cyan-100 text-cyan-700' },
  EN_COMMISSION_BP:     { label: 'Commission BP',     class: 'bg-teal-100 text-teal-700' },
  ACCORD_PRINCIPE:      { label: 'Accord principe',   class: 'bg-lime-100 text-lime-700' },
  ARRETE_EN_COURS:      { label: 'Arrêté en cours',   class: 'bg-yellow-100 text-yellow-800' },
  SIGNATURE_DGI:        { label: 'Signature DGI',     class: 'bg-amber-100 text-amber-700' },
  SIGNATURE_MMI:        { label: 'Signature MMI',     class: 'bg-amber-100 text-amber-800' },
  VALIDE:               { label: 'Validée',           class: 'bg-green-100 text-green-800' },
  REJETE:               { label: 'Rejetée',           class: 'bg-red-100 text-red-800' },
}

export default function StatusBadge({ statut }: { statut: string }) {
  const s = STATUT_MAP[statut] || { label: statut, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.class}`}>
      {s.label}
    </span>
  )
}
