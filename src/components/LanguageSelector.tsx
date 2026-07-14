import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
import { locale as localeApi } from '@/services/api'

const OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'es', label: 'Español' },
  { value: 'pap', label: 'Papiamentu' },
]

export default function LanguageSelector() {
  const [locale, setLocale] = useState(() => localStorage.getItem('trimind_locale') || 'en')

  useEffect(() => {
    localeApi.get().then(({ locale: suggested }) => {
      if (!localStorage.getItem('trimind_locale')) {
        localStorage.setItem('trimind_locale', suggested)
        setLocale(suggested)
      }
    }).catch(() => {})
  }, [])

  const changeLocale = async (next: string) => {
    setLocale(next)
    localStorage.setItem('trimind_locale', next)
    try { await localeApi.save(next) } catch { /* Guests keep the local preference. */ }
  }

  return (
    <label className="flex items-center gap-2 text-white/60 text-sm" aria-label="Choose language">
      <Languages className="w-4 h-4" />
      <select value={locale} onChange={event => changeLocale(event.target.value)} className="bg-transparent text-white outline-none cursor-pointer">
        {OPTIONS.map(option => <option key={option.value} value={option.value} className="bg-[#15151d]">{option.label}</option>)}
      </select>
    </label>
  )
}
