import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import CatalogPage from './pages/CatalogPage'
import AuthPage from './pages/AuthPage'
import { Toaster } from './components/ui/toaster'
import { Toaster as Sonner } from './components/ui/sonner'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectView />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/login" element={<AuthPage />} />
      </Routes>
      <Toaster />
      <Sonner />
    </BrowserRouter>
  )
}
