import { Hono } from 'hono'
import { uid, getBearer, verifyJWT } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }
const projects = new Hono<{ Bindings: Env }>()

async function getUser(c: any): Promise<{ sub: string; is_guest?: boolean }> {
  const token = getBearer(c.req.header('Authorization'))
  if (token) {
    const p = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret')
    if (p) return p
  }
  // Auto-create guest session
  return { sub: 'guest_' + uid(), is_guest: true }
}

projects.get('/', async c => {
  const user = await getUser(c)
  const { results } = await c.env.DB.prepare(`
    SELECT p.*, 
      CASE WHEN u.id IS NOT NULL THEN 1 ELSE 0 END as has_uvz,
      CASE WHEN pr.id IS NOT NULL THEN 1 ELSE 0 END as has_product,
      CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END as has_tool,
      CASE WHEN ch.id IS NOT NULL THEN 1 ELSE 0 END as has_chatbot,
      CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as has_funnel
    FROM projects p
    LEFT JOIN uvz_analyses u ON u.project_id = p.id
    LEFT JOIN product_outlines pr ON pr.project_id = p.id
    LEFT JOIN distribution_plans t ON t.project_id = p.id
    LEFT JOIN faqs ch ON ch.project_id = p.id
    LEFT JOIN funnel_flows f ON f.project_id = p.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC LIMIT 50
  `).bind(user.sub).all<any>()
  return c.json({ projects: results })
})

projects.post('/', async c => {
  const user = await getUser(c)
  const { keyword } = await c.req.json()
  if (!keyword?.trim()) return c.json({ error: 'keyword required' }, 400)
  const id = uid()
  const now = new Date().toISOString()
  await c.env.DB.prepare('INSERT INTO projects (id, keyword, status, user_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, keyword.trim().toLowerCase(), 'analyzing', user.sub, now).run()
  return c.json({ project: { id, keyword: keyword.trim().toLowerCase(), status: 'analyzing', user_id: user.sub, created_at: now } }, 201)
})

projects.get('/:id', async c => {
  const id = c.req.param('id')
  const p = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<any>()
  if (!p) return c.json({ error: 'Not found' }, 404)
  return c.json({ project: p })
})

projects.delete('/:id', async c => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  return c.json({ deleted: true })
})

export default projects
