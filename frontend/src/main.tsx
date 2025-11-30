import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { IntercomProvider } from './context/IntercomProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IntercomProvider>
          <App />
        </IntercomProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
