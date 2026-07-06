// Module 2 — Product Format Generator
import { Hono } from 'hono'
import { chat, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const product = new Hono<{ Bindings: Env }>()

product.post('/generate', async c => {
  const { project_id, uvz_text } = await c.req.json()
  if (!project_id || !uvz_text) return c.json({ error: 'project_id and uvz_text required' }, 400)

  const prompt = `Based on this UVZ (Unique Value Zone): "${uvz_text}"

Generate a complete digital product package. Return ONLY valid JSON:
{
  "id": "${uid()}",
  "title": "compelling product title that sounds like a specific promise",
  "format": "PDF guide | flipbook | short course | calculator | quiz | tracker | planner | chatbot",
  "recommended_tool_type": "calculator | quiz | planner | tracker | generator",
  "price_low": 17,
  "price_high": 47,
  "transformation": "one sentence describing the exact transformation the buyer gets",
  "outline": [
    "Module 1: [specific title]",
    "Module 2: [specific title]",
    "Module 3: [specific title]",
    "Module 4: [specific title]",
    "Module 5: [specific title]",
    "Module 6: [specific title]",
    "Module 7: [specific title — optional]"
  ],
  "persona": "the AI advisor persona name and style (e.g. 'Zara — direct, results-obsessed digital product coach')",
  "whop_description": "2-3 sentences for a Whop product listing"
}

Make the title ultra-specific. Include numbers when possible. Think about what someone in this UVZ would ACTUALLY search for and buy.`

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured' }, 503)

  const raw = await chat(apiKey, [
    { role: 'system', content: UVZ_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ])
  const productData = tryJSON(raw)
  if (!productData?.title) return c.json({ error: 'AI error', raw: raw.slice(0, 500) }, 500)

  const now = new Date().toISOString()
  const id = productData.id || uid()

  // Store in product_outlines for retrieval
  await c.env.DB.prepare('INSERT OR REPLACE INTO product_outlines (id, project_id, product_type, rationale, outline_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, project_id, productData.format, productData.transformation, JSON.stringify(productData), now).run().catch(() => {})

  // Update products catalog entry
  await c.env.DB.prepare('UPDATE products SET product_title = ?, product_outline = ?, best_uvz_reason = ?, updated_at = ? WHERE id IN (SELECT id FROM products WHERE keyword IN (SELECT keyword FROM projects WHERE id = ?) LIMIT 1)')
    .bind(productData.title, JSON.stringify(productData.outline), productData.transformation, now, project_id).run().catch(() => {})

  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?').bind('product-done', project_id).run().catch(() => {})

  return c.json({ product: { ...productData, id, project_id } })
})

product.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  const row = await c.env.DB.prepare('SELECT * FROM product_outlines WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').bind(projectId).first<any>()
  if (!row) return c.json({ product: null })
  const data = tryJSON(row.outline_json, {})
  return c.json({ product: { ...data, id: row.id, project_id: row.project_id } })
})

export default product
