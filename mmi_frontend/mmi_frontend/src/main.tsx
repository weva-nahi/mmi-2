import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import './i18n/i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Montserrat, Cairo, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#1B6B30', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
