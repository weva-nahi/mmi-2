import React from 'react'
 
export default function Footer() {
  return (
    <footer
      style={{
        background: 'linear-gradient(90deg, #1a6b00 0%, #3a8c00 30%, #c8a400 70%, #f5c800 100%)',
        borderTop: '4px solid #e87000',
        padding: '20px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
        © {new Date().getFullYear()} Ministère des Mines et de l'Industrie - République Islamique de Mauritanie
      </p>
    </footer>
  )
}
 