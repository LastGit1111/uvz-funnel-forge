// Module 7 — Catalog & Analytics
import { Hono } from 'hono'
import { uid } from '../lib/auth'

type Env = { DB: D1Database; JWT_SECRET: string }
const catalog = new Hono<{ Bindings: Env }>()

// List all products
catalog.get('/', async c => {
  const { results } = await c.env.DB.prepare(
    `SELECT products.*,
            (SELECT id FROM projects WHERE projects.keyword = products.keyword ORDER BY created_at DESC LIMIT 1) as project_id
     FROM products
     ORDER BY products.created_at DESC
     LIMIT 100`
  ).all<any>()
  return c.json({ products: results || [] })
})

// Catalog stats
catalog.get('/stats', async c => {
  const [products, funnels, chats, events] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as n FROM products').first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM funnel_flows').first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM conversations').first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM analytics').first<any>(),
  ])
  return c.json({
    total_products: products?.n || 0,
    total_funnels: funnels?.n || 0,
    total_chats: chats?.n || 0,
    total_events: events?.n || 0,
  })
})

// Single product
catalog.get('/:id', async c => {
  const id = c.req.param('id')
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<any>()
  if (!product) return c.json({ error: 'Not found' }, 404)
  return c.json({ product })
})

// Track analytics event
catalog.post('/event', async c => {
  const { product_id, event_type, metadata } = await c.req.json()
  if (!product_id || !event_type) return c.json({ error: 'product_id and event_type required' }, 400)

  const id = uid()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO analytics (id, product_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, product_id, event_type, JSON.stringify(metadata || {}), now).run()

  return c.json({ tracked: true, id })
})

export default catalog
