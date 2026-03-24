import React from 'react'

export default function HeroBanner() {
  return (
    <div className="w-full overflow-hidden">
      <img
        src="/images/banner_mmi.jpg"
        alt="Ministère des Mines et de l'Industrie"
        className="w-full block"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}