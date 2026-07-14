import { useState } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await (mode === 'login' ? auth.login(email, password) : auth.register(email, password))
      navigate('/')
    } catch (reason: any) {
      setError(reason.message || 'Unable to continue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen caribbean-shell text-white flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-7 space-y-5">
        <div className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-violet-400" /><div><h1 className="font-bold text-xl">UVZ Funnel Forge</h1><p className="text-sm text-white/45">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</p></div></div>
        <label className="block text-sm text-white/70">Email<Input type="email" value={email} onChange={event => setEmail(event.target.value)} required className="mt-2 bg-white/5 border-white/15 text-white" /></label>
        <label className="block text-sm text-white/70">Password<div className="relative mt-2"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} className="bg-white/5 border-white/15 text-white pr-12" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500">{loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
        <button type="button" className="w-full text-sm text-violet-300 hover:text-violet-200" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}</button>
      </form>
    </main>
  )
}
