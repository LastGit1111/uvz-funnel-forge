import { Hono } from 'hono'
import { uid } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }
const projects = new Hono<{ Bindings: Env }>()
const themeTypes = ['country', 'place', 'event', 'zodiac', 'custom'] as const

async function getUser(c: any): Promise<{ sub: string; is_guest?: boolean }> {
  return c.get('user')
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
  const { keyword, theme_type, theme_value } = await c.req.json()
  if (!keyword?.trim()) return c.json({ error: 'keyword required' }, 400)
  if (theme_type && !themeTypes.includes(theme_type)) return c.json({ error: 'invalid theme_type' }, 400)
  if (theme_type && !theme_value?.trim()) return c.json({ error: 'theme_value required when theme_type is set' }, 400)
  const id = uid()
  const now = new Date().toISOString()
  const normalizedType = theme_type || null
  const normalizedValue = normalizedType ? theme_value.trim() : null
  await c.env.DB.prepare('INSERT INTO projects (id, keyword, status, user_id, theme_type, theme_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, keyword.trim().toLowerCase(), 'analyzing', user.sub, normalizedType, normalizedValue, now).run()
  return c.json({ project: { id, keyword: keyword.trim().toLowerCase(), status: 'analyzing', user_id: user.sub, theme_type: normalizedType, theme_value: normalizedValue, created_at: now } }, 201)
})

projects.get('/:id', async c => {
  const id = c.req.param('id')
  const user = await getUser(c)
  const p = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').bind(id, user.sub).first<any>()
  if (!p) return c.json({ error: 'Not found' }, 404)
  return c.json({ project: p })
})

projects.delete('/:id', async c => {
  const id = c.req.param('id')
  const user = await getUser(c)
  const result = await c.env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').bind(id, user.sub).run()
  if (!result.meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ deleted: true })
})

export default projects
