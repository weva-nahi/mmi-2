import React from 'react'
import { Check, Building2, Users, User } from 'lucide-react'
import HeroBanner from '@/components/ui/HeroBanner'

export default function PMNEPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero banner ── */}
           {/* ── HERO BANNER ───────────────────────────────────── */}
      <div className="w-full overflow-hidden bg-mmi-green" style={{ maxHeight: 320 }}>
        <img
          src="/images/banner_mmi.jpg"
          alt="Ministère des Mines et de l'Industrie"
          className="w-full h-full object-cover object-center block"
          style={{ maxHeight: 320 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      {/* ── Présentation ── */}
      <section className="bg-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold mb-5" style={{ color: '#1a2e6b' }}>
            Présentation du Programme
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            L'objectif du programme de mise à niveau est d'accompagner l'entreprise vers un niveau supérieur de
            performance à travers un appui technique, financier et organisationnel.
          </p>
        </div>
      </section>

      {/* ── Objectifs Principaux ── */}
      <section className="py-12" style={{ background: '#f0f4f8' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#1B6B30' }}>
            Objectifs Principaux
          </h2>
          <div className="h-0.5 w-full mb-8" style={{ background: '#C8A400' }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Améliorer la performance des entreprises",
              "Moderniser les équipements et processus industriels",
              "Renforcer la compétitivité internationale",
              "Stimuler l'innovation et la transformation digitale",
            ].map(obj => (
              <div key={obj} className="bg-white rounded-xl p-5 shadow-sm flex items-start gap-3">
                <Check size={18} className="text-mmi-green flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-snug">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Types de membres ── */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1a2e6b' }}>
            Types de membres
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="rounded-2xl border-2 p-8 text-center transition-all hover:shadow-md cursor-pointer"
                 style={{ borderColor: '#22c55e' }}>
              <div className="flex justify-center mb-4">
                <Building2 size={52} className="text-gray-400" strokeWidth={1.2} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a2e6b' }}>Entreprise</h3>
              <p className="text-gray-500 text-sm">Parcours de mise à niveau complet</p>
            </div>

            <div className="rounded-2xl border-2 p-8 text-center transition-all hover:shadow-md cursor-pointer"
                 style={{ borderColor: '#3b82f6' }}>
              <div className="flex justify-center mb-4">
                <Users size={52} className="text-indigo-600" strokeWidth={1.2} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a2e6b' }}>Association</h3>
              <p className="text-gray-500 text-sm">Accompagnement collectif</p>
            </div>

            <div className="rounded-2xl border-2 p-8 text-center transition-all hover:shadow-md cursor-pointer"
                 style={{ borderColor: '#7c3aed' }}>
              <div className="flex justify-center mb-4">
                <User size={52} className="text-purple-600" strokeWidth={1.2} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#1a2e6b' }}>Membre Individuel</h3>
              <p className="text-gray-500 text-sm">Parcours personnalisé</p>
            </div>
          </div>

          <div className="text-center">
            <button
              disabled
              className="px-10 py-3.5 rounded-full text-white font-semibold text-sm cursor-not-allowed"
              style={{ background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}
            >
              Demander une adhésion au PMNE (à venir)
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}