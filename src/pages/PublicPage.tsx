import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

const copy: Record<string, { title: string; body: ReactNode }> = {
  '/privacy': { title: 'Privacy notice', body: <><p>UVZ Funnel Forge processes account information, project inputs, generated content, and files you choose to upload so the service can provide your workspace.</p><p>Do not enter confidential, regulated, or personal information you are not authorized to process. Access to project data is limited to the authenticated project owner. Contact details and retention settings will be published before paid customer onboarding.</p></> },
  '/terms': { title: 'Terms of use', body: <><p>UVZ Funnel Forge is a workspace for generating product, funnel, and content drafts. You remain responsible for reviewing all outputs, obtaining rights to your inputs, and complying with applicable laws and platform rules.</p><p>Generated material may contain errors and is not legal, financial, medical, or marketing compliance advice. Do not rely on it without independent review.</p></> },
  '/contact': { title: 'Contact', body: <><p>Support is being configured for this launch. For account, privacy, or security questions, use the support channel supplied with your subscription or deployment invitation.</p><p>Do not send passwords, payment data, or API keys through support messages.</p></> },
  '/security': { title: 'Security', body: <><p>UVZ Funnel Forge uses authenticated project access, encrypted HTTPS transport, private object storage for project uploads, and a managed Cloudflare application platform.</p><p>Report a suspected vulnerability through the support channel. Do not exploit a suspected issue or access another person’s information.</p></> },
}

export function PublicPage() {
  const { pathname } = useLocation()
  const page = copy[pathname]
  if (!page) return <NotFoundPage />
  return <main className="min-h-screen bg-[#061f2d] px-6 py-16 text-white"><section className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/5 p-8"><Link to="/" className="text-cyan-300">← Back to UVZ Funnel Forge</Link><h1 className="mt-8 text-4xl font-bold">{page.title}</h1><div className="mt-6 space-y-4 text-slate-200 leading-7">{page.body}</div><p className="mt-8 text-sm text-slate-400">Last updated: 16 July 2026</p></section></main>
}

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-[#061f2d] p-6 text-center text-white"><section><p className="text-cyan-300">404</p><h1 className="mt-2 text-4xl font-bold">This page does not exist</h1><p className="mt-3 text-slate-300">Check the address or return to your workspace.</p><Link to="/" className="mt-7 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Go to dashboard</Link></section></main>
}
