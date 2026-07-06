import { createMiddleware } from 'hono/factory'
import { verifyJWT, getBearer } from '../lib/auth'

export const optionalAuth = createMiddleware<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>(async (c, next) => {
  const token = getBearer(c.req.header('Authorization'))
  if (token) {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (payload) c.set('user' as never, payload)
  }
  await next()
})

export const requireAuth = createMiddleware<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>(async (c, next) => {
  const token = getBearer(c.req.header('Authorization'))
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const payload = await verifyJWT(token, c.env.JWT_SECRET)
  if (!payload) return c.json({ error: 'Invalid token' }, 401)
  c.set('user' as never, payload)
  await next()
})
