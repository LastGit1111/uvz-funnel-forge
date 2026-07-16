import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function AdminPage() {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: any }>({ loading: true })
  useEffect(() => { api.get('/api/admin/overview').then(data => setState({ loading: false, data })).catch((error: Error) => setState({ loading: false, error: error.message })) }, [])
  return <main className="min-h-screen bg-[#061f2d] p-6 text-white"><section className="mx-auto max-w-5xl"><Link to="/" className="text-cyan-300">← Dashboard</Link><h1 className="mt-6 text-3xl font-bold">Administration</h1>{state.loading && <p className="mt-6 text-slate-300">Loading protected metrics…</p>}{state.error && <p className="mt-6 rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 text-amber-100">{state.error}. Sign in with an account granted administrator access.</p>}{state.data && <div className="mt-6 grid gap-4 sm:grid-cols-3">{Object.entries(state.data.metrics).map(([key, value]) => <div key={key} className="rounded-xl border border-white/15 bg-white/5 p-5"><p className="text-sm uppercase text-slate-400">{key}</p><p className="mt-2 text-3xl font-bold">{String(value)}</p></div>)}</div>}</section></main>
}
