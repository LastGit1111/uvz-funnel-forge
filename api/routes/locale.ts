import { Hono } from 'hono'
import { getBearer, verifyJWT } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }

export const SUPPORTED_LOCALES = ['en', 'nl', 'es', 'pap'] as const
type Locale = typeof SUPPORTED_LOCALES[number]

const countryLocale: Record<string, Locale> = {
  NL: 'nl',
  ES: 'es',
  AW: 'pap',
  CW: 'pap',
  BQ: 'pap',
}

function normalizeLocale(value: string | null | undefined): Locale | null {
  const primary = value?.toLowerCase().split(/[-_]/)[0]
  if (primary === 'en' || primary === 'nl' || primary === 'es') return primary
  if (primary === 'pap' || primary === 'pap-aw' || primary === 'pap-an') return 'pap'
  return null
}

function suggestedLocale(c: any): Locale {
  const country = c.req.header('CF-IPCountry')?.toUpperCase()
  if (country && countryLocale[country]) return countryLocale[country]

  const accepted = c.req.header('Accept-Language')?.split(',') ?? []
  for (const entry of accepted) {
    const locale = normalizeLocale(entry.trim().split(';')[0])
    if (locale) return locale
  }
  return 'en'
}

async function currentUser(c: any) {
  const token = getBearer(c.req.header('Authorization'))
  if (!token) return null
  if (!c.env.JWT_SECRET) return null
  return verifyJWT(token, c.env.JWT_SECRET)
}

const locale = new Hono<{ Bindings: Env }>()

locale.get('/', async c => {
  const suggested = suggestedLocale(c as any)
  const user = await currentUser(c)
  if (!user || user.is_guest) return c.json({ locale: suggested, suggested_locale: suggested, source: 'suggestion' })

  const row = await c.env.DB.prepare('SELECT locale FROM users WHERE id = ?').bind(user.sub).first<{ locale?: string }>()
  const saved = normalizeLocale(row?.locale)
  return c.json({ locale: saved || suggested, suggested_locale: suggested, source: saved ? 'saved' : 'suggestion' })
})

locale.put('/', async c => {
  const user = await currentUser(c)
  if (!user || user.is_guest) return c.json({ error: 'Sign in to sync a language preference' }, 401)
  const body = await c.req.json<{ locale?: string }>()
  const selected = normalizeLocale(body.locale)
  if (!selected) return c.json({ error: `locale must be one of: ${SUPPORTED_LOCALES.join(', ')}` }, 400)

  await c.env.DB.prepare('UPDATE users SET locale = ? WHERE id = ?').bind(selected, user.sub).run()
  return c.json({ locale: selected, source: 'saved' })
})

export default locale
