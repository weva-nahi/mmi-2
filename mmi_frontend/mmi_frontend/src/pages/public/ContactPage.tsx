import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Clock, Printer, Send, CheckCircle } from 'lucide-react'

const SUJETS = [
  'Suggestion',
  'Demande d\'information',
  'Réclamation',
  'Partenariat',
  'Autre',
]

export default function ContactPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', sujet: 'Suggestion', message: ''
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { api } = await import('@/utils/api')
      await api.post('/contact/', form)
      setSent(true)
    } catch (err: any) {
      const toast = (await import('react-hot-toast')).default
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Titre */}
        <div className="mb-10">
          <h1 className="section-title text-3xl mb-2">Contact</h1>
          <div className="h-0.5 w-32 bg-mmi-green rounded" />
          <p className="text-gray-500 text-sm mt-3">
            Ministère des Mines et de l'Industrie — République Islamique de Mauritanie
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Colonne gauche : infos + contacts ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Infos générales */}
            {[
              { icon: Mail,    label: 'Email',            value: 'contact-mmi@mmi.gov.mr',             href: 'mailto:contact-mmi@mmi.gov.mr' },
              { icon: Phone,   label: 'Téléphone',        value: '00 222 45 24 25 41',                  href: 'tel:+22245242541' },
              { icon: Printer, label: 'Boîte Postale',    value: 'BP 4921',                             href: null },
              { icon: MapPin,  label: 'Adresse',          value: 'Ilot C 102 et 103 / Av Aboubecar Ben Amer', href: null },
              { icon: Clock,   label: "Horaires",         value: 'Lun - Ven : 8h00 - 16h00',           href: null },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: '#0F6E56' }}>
                  <item.icon size={16} color="white" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#0F6E56' }}>{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-gray-700 text-sm hover:text-mmi-green hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-gray-700 text-sm">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Contacts principaux */}
            <div className="pt-4 space-y-4">
              <ContactCard
                titre="Contact Principal"
                nom="Babacar Mohamed Baba"
                structure="Directeur du Développement et de la Promotion Industrielle (DDPI)"
                tel1="00 222 43 45 11 00"
                tel2="00 222 22 84 61 23"
                email="b.mbaba@mmi.gov.mr"
              />
              <ContactCard
                titre="Contact Principal PMN"
                nom="Khadijetou ABDELWEHAB"
                structure="Directrice de la Restructuration et Mise à Niveau des Entreprises (DRMNE)"
                tel1="00 222 42 14 86 11"
                tel2="00 222 28 22 58 33"
                email="k.abdelwehab@mmi.gov.mr"
              />
              <ContactCard
                titre="Propriété Industrielle — OAPI"
                nom="Sidi Mohamed Moustapha"
                structure="Directeur de la propriété industrielle — Structure Nationale de liaison avec l'OAPI"
                tel1="42 43 42 91"
                tel2=""
                email="Sidimd66@yahoo.fr"
              />
            </div>
          </div>

          {/* ── Colonne droite : formulaire ── */}
          <div className="lg:col-span-3">
            <div className="card p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Envoyer un message</h2>

              {sent ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-mmi-green-lt rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-mmi-green" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Message envoyé !</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ nom:'', email:'', telephone:'', sujet:'Suggestion', message:'' }) }}
                    className="btn-primary text-sm"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Nom + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        <span className="text-red-500 mr-1">*</span>Nom complet
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Votre nom"
                        value={form.nom}
                        onChange={e => up('nom', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        <span className="text-red-500 mr-1">*</span>Email
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="votre@email.com"
                        value={form.email}
                        onChange={e => up('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="form-label">Téléphone</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input
                        type="tel"
                        className="form-input pl-9"
                        placeholder="+222 XX XX XX XX"
                        value={form.telephone}
                        onChange={e => up('telephone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sujet */}
                  <div>
                    <label className="form-label">
                      <span className="text-red-500 mr-1">*</span>Sujet
                    </label>
                    <select
                      className="form-input"
                      value={form.sujet}
                      onChange={e => up('sujet', e.target.value)}
                      required
                    >
                      {SUJETS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="form-label">
                      <span className="text-red-500 mr-1">*</span>Message
                    </label>
                    <textarea
                      className="form-input resize-none"
                      rows={6}
                      placeholder="Décrivez votre demande en détail..."
                      maxLength={1000}
                      value={form.message}
                      onChange={e => up('message', e.target.value)}
                      required
                    />
                    <p className="text-right text-xs text-gray-400 mt-1">
                      {form.message.length} / 1000
                    </p>
                  </div>

                  {/* Bouton */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ContactCardProps {
  titre: string; nom: string; structure: string
  tel1: string; tel2: string; email: string
}

function ContactCard({ titre, nom, structure, tel1, tel2, email }: ContactCardProps) {
  return (
    <div className="rounded-xl p-4 text-sm space-y-1.5"
         style={{ background: '#f0faf6', border: '1px solid #c8e6d4' }}>
      <h3 className="font-bold text-base mb-2" style={{ color: '#1B6B30' }}>{titre}</h3>
      <Row label="Nom" value={nom} />
      <div>
        <span className="font-semibold text-xs block mb-0.5" style={{ color: '#0F6E56' }}>Structure</span>
        <span className="text-gray-700 text-xs">{structure}</span>
      </div>
      {tel1 && <Row label="Téléphone 1" value={tel1} href={`tel:${tel1.replace(/\s/g,'')}`} />}
      {tel2 && <Row label="Téléphone 2" value={tel2} href={`tel:${tel2.replace(/\s/g,'')}`} />}
      {email && <Row label="E-mail" value={email} href={`mailto:${email}`} colored />}
    </div>
  )
}

function Row({ label, value, href, colored }: { label: string; value: string; href?: string; colored?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="font-semibold text-xs w-24 flex-shrink-0" style={{ color: '#0F6E56' }}>{label}</span>
      {href ? (
        <a href={href} className={`text-xs hover:underline ${colored ? '' : 'text-gray-800 hover:text-mmi-green'}`}
           style={colored ? { color: '#0F6E56' } : {}}>
          {value}
        </a>
      ) : (
        <span className="text-gray-800 text-xs">{value}</span>
      )}
    </div>
  )
}