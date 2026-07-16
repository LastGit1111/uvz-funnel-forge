import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import CatalogPage from './pages/CatalogPage'
import AuthPage from './pages/AuthPage'
import { Toaster } from './components/ui/toaster'
import { Toaster as Sonner } from './components/ui/sonner'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { NotFoundPage, PublicPage } from './pages/PublicPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <AppErrorBoundary><BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/privacy" element={<PublicPage />} />
        <Route path="/terms" element={<PublicPage />} />
        <Route path="/contact" element={<PublicPage />} />
        <Route path="/security" element={<PublicPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
      <Sonner />
    </BrowserRouter></AppErrorBoundary>
  )
}
