import { Languages } from 'lucide-react'
import { type Locale, useLocale } from '@/i18n'

const OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'es', label: 'Español' },
  { value: 'pap', label: 'Papiamentu' },
]

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale()

  return (
    <label className="flex items-center gap-2 text-white/60 text-sm" aria-label="Choose language">
      <Languages className="w-4 h-4" />
      <select value={locale} onChange={event => setLocale(event.target.value as Locale)} className="bg-transparent text-white outline-none cursor-pointer">
        {OPTIONS.map(option => <option key={option.value} value={option.value} className="bg-[#15151d]">{option.label}</option>)}
      </select>
    </label>
  )
}
