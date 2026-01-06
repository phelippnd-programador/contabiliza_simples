import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './app/router.tsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import { PlanProvider } from './shared/context/PlanContext'
import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
        <PlanProvider>
          <RouterProvider router={router} />
        </PlanProvider>
      </AuthProvider>
  </StrictMode>,
)
