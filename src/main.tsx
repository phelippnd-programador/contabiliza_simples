import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './app/router.tsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
  </StrictMode>,
)
