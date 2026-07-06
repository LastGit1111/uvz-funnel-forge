import { Hono } from 'hono'
import { uid, hashPassword, verifyPassword, signJWT, getBearer, verifyJWT } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }
const auth = new Hono<{ Bindings: Env }>()

// Guest / anonymous session — always succeeds, returns a guest token
auth.get('/guest', async c => {
  const guestId = 'guest_' + uid()
  const token = await signJWT({ sub: guestId, email: 'guest@local', tier: 'free', is_guest: true }, c.env.JWT_SECRET || 'dev-secret')
  return c.json({ token, user: { id: guestId, email: 'guest@local', tier: 'free' } })
})

auth.post('/register', async c => {
  const { email, password } = await c.req.json()
  if (!email || !password) return c.json({ error: 'email and password required' }, 400)
  const id = uid()
  const hash = await hashPassword(password)
  try {
    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, tier, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, email.toLowerCase(), hash, 'free', new Date().toISOString()).run()
    const token = await signJWT({ sub: id, email, tier: 'free' }, c.env.JWT_SECRET || 'dev-secret')
    return c.json({ token, user: { id, email, tier: 'free' } })
  } catch {
    return c.json({ error: 'Email already exists' }, 409)
  }
})

auth.post('/login', async c => {
  const { email, password } = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email?.toLowerCase()).first<any>()
  if (!user || !(await verifyPassword(password, user.password_hash))) return c.json({ error: 'Invalid credentials' }, 401)
  const token = await signJWT({ sub: user.id, email: user.email, tier: user.tier }, c.env.JWT_SECRET || 'dev-secret')
  return c.json({ token, user: { id: user.id, email: user.email, tier: user.tier } })
})

auth.get('/me', async c => {
  const token = getBearer(c.req.header('Authorization'))
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const payload = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret')
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  return c.json({ user: payload })
})

export default auth
