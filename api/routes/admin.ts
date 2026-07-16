import { Hono } from 'hono'

type Env = { DB: D1Database; JWT_SECRET: string }
const admin = new Hono<{ Bindings: Env }>()

admin.use('*', async (c, next) => {
  const user = c.get('user' as never) as { sub?: string } | undefined
  const row = user?.sub && await c.env.DB.prepare('SELECT is_admin FROM users WHERE id = ?').bind(user.sub).first<{ is_admin: number }>()
  if (!row?.is_admin) return c.json({ error: 'Administrator access required' }, 403)
  await next()
})

admin.get('/overview', async c => {
  const [users, projects, products, recentProjects] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM projects').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>(),
    c.env.DB.prepare('SELECT id, keyword, status, created_at FROM projects ORDER BY created_at DESC LIMIT 10').all(),
  ])
  return c.json({ metrics: { users: users?.count || 0, projects: projects?.count || 0, products: products?.count || 0 }, recent_projects: recentProjects.results })
})

export default admin
