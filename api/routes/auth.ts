import { Hono } from 'hono'
import { uid, hashPassword, verifyPassword, signJWT, getBearer, verifyJWT, isLegacyPasswordHash } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }
const auth = new Hono<{ Bindings: Env }>()

function configuredSecret(c: any) {
  return c.env.JWT_SECRET?.trim() || null
}

// Guest / anonymous session — always succeeds, returns a guest token
auth.get('/guest', async c => {
  const secret = configuredSecret(c)
  if (!secret) return c.json({ error: 'Authentication is not configured' }, 503)
  const guestId = 'guest_' + uid()
  const token = await signJWT({ sub: guestId, email: 'guest@local', tier: 'free', is_guest: true }, secret)
  return c.json({ token, user: { id: guestId, email: 'guest@local', tier: 'free' } })
})

auth.post('/register', async c => {
  const { email, password } = await c.req.json()
  const secret = configuredSecret(c)
  if (!secret) return c.json({ error: 'Authentication is not configured' }, 503)
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return c.json({ error: 'Use a valid email and a password between 12 and 128 characters' }, 400)
  }
  const id = uid()
  const hash = await hashPassword(password)
  try {
    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, tier, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, email.toLowerCase(), hash, 'free', new Date().toISOString()).run()
    const token = await signJWT({ sub: id, email, tier: 'free' }, secret)
    return c.json({ token, user: { id, email, tier: 'free' } })
  } catch {
    return c.json({ error: 'Email already exists' }, 409)
  }
})

auth.post('/login', async c => {
  const { email, password } = await c.req.json()
  const secret = configuredSecret(c)
  if (!secret) return c.json({ error: 'Authentication is not configured' }, 503)
  if (typeof email !== 'string' || typeof password !== 'string') return c.json({ error: 'Invalid credentials' }, 401)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email?.toLowerCase()).first<any>()
  if (!user || !(await verifyPassword(password, user.password_hash))) return c.json({ error: 'Invalid credentials' }, 401)
  if (isLegacyPasswordHash(user.password_hash)) {
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), user.id).run()
  }
  const token = await signJWT({ sub: user.id, email: user.email, tier: user.tier }, secret)
  return c.json({ token, user: { id: user.id, email: user.email, tier: user.tier } })
})

auth.get('/me', async c => {
  const token = getBearer(c.req.header('Authorization'))
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const secret = configuredSecret(c)
  if (!secret) return c.json({ error: 'Authentication is not configured' }, 503)
  const payload = await verifyJWT(token, secret)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  return c.json({ user: payload })
})

export default auth
