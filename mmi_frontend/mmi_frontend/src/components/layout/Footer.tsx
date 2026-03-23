import { Link } from 'react-router-dom'
import { Facebook, Linkedin, Globe, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Logo + description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/images/logo_mmi.png" alt="MMI" className="h-12 w-12 object-contain rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div>
                <p className="text-white font-bold text-sm">وزارة المعادن والصناعة</p>
                <p className="text-xs text-gray-400">MINISTÈRE DES MINES ET DE L'INDUSTRIE</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4">
              Direction Générale de l'Industrie — République Islamique de Mauritanie.
              Plateforme numérique de gestion des autorisations industrielles.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-mmi-green transition-colors"><Facebook size={14} /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-mmi-green transition-colors"><Linkedin size={14} /></a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-mmi-green transition-colors"><Globe size={14} /></a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: "Portail de l'industrie" },
                { to: '/connexion', label: 'Espace demandeur' },
                { to: '/contact', label: 'Contact' },
                { to: '/pmne', label: 'PMNE' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white hover:underline transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-mmi-gold flex-shrink-0" />
                <span>Nouakchott, République Islamique de Mauritanie</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-mmi-gold flex-shrink-0" />
                <span>+222 45 25 XX XX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-mmi-gold flex-shrink-0" />
                <a href="mailto:contact@mmi.gov.mr" className="hover:text-white transition-colors">
                  contact@mmi.gov.mr
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Ministère des Mines et de l'Industrie — Mauritanie. Tous droits réservés.</p>
          <p>Développé par <span className="text-mmi-gold font-medium">Richat Partners</span></p>
        </div>
      </div>
    </footer>
  )
}
