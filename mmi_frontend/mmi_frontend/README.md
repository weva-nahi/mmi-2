# MMI Frontend — React + Vite + TypeScript

## Structure
```
public/
  images/
    logo_mmi.png          ← Logo MMI (à ajouter)
    logo_mauritanie.png   ← Armoiries Mauritanie (à ajouter)
    banner_mmi.jpg        ← Image de fond bannière (à ajouter)
src/
  components/
    layout/ → Navbar, Footer
    ui/     → StatusBadge, RouteGuard
  pages/
    public/   → HomePage
    auth/     → LoginPage, RegisterPage
    demandeur → Dashboard, Layout
  store/  → authStore (Zustand)
  utils/  → api.ts (Axios → Django backend)
  i18n/   → FR / EN / AR
```

## Installation
```bash
npm install
```

## Configuration
Créer `.env.local` :
```
VITE_API_URL=http://localhost:8000/api
```

## Démarrage
```bash
npm run dev        # http://localhost:3000
npm run build      # Production
```

## Images à placer dans public/images/
- logo_mmi.png        (logo circulaire vert/or du MMI)
- logo_mauritanie.png (armoiries RIM - fond rouge/vert/or)
- banner_mmi.jpg      (photo industrielle pour le hero)
