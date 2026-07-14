// Module 6 — Funnel Builder
import { Hono } from 'hono'
import { chat, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const funnel = new Hono<{ Bindings: Env }>()

funnel.post('/build', async c => {
  const { project_id } = await c.req.json()
  if (!project_id) return c.json({ error: 'project_id required' }, 400)

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured' }, 503)

  // Load product + UVZ data
  const productRow = await c.env.DB.prepare(
    'SELECT * FROM product_outlines WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(project_id).first<any>()
  const productData = tryJSON(productRow?.outline_json, {})

  const uvzRow = await c.env.DB.prepare(
    'SELECT * FROM uvz_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(project_id).first<any>()

  const uvzText = uvzRow?.selected_uvz || ''
  const project = await c.env.DB.prepare('SELECT theme_type, theme_value FROM projects WHERE id = ?').bind(project_id).first<any>()
  const theme = project?.theme_type && project?.theme_value
    ? `${project.theme_type}: ${project.theme_value}`
    : 'No explicit theme; use a clean, audience-appropriate visual direction.'
  const title = productData?.title || 'Digital Product'
  const transformation = productData?.transformation || ''
  const priceLow = productData?.price_low || 17
  const priceHigh = productData?.price_high || 47

  const prompt = `Build a complete sales funnel for this digital product:
Product Title: "${title}"
UVZ (Target Audience): "${uvzText}"
Transformation Promise: "${transformation}"
Price Range: $${priceLow}–$${priceHigh}
Landing Page Theme: "${theme}"

Use the theme as a visual and editorial direction, not as a reason to make false local, cultural, event, or astrological claims. Include a practical design direction with palette, imagery, and tone that a page builder can use.

Return ONLY valid JSON:
{
  "funnel_name": "name for this funnel",
  "landing_page": {
    "headline": "the main hero headline — specific, benefit-driven, no fluff",
    "subheadline": "one sentence expanding on the headline",
    "hero_bullets": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
    "cta_primary": "Call to action button text",
    "social_proof": "fake-realistic testimonial or social proof statement",
    "guarantee": "risk reversal statement",
    "design_direction": { "palette": ["color 1", "color 2", "color 3"], "imagery": "specific image/art direction", "tone": "visual and editorial tone" }
  },
  "three_angle_offer": [
    { "angle": "Pain Angle", "hook": "headline from pain perspective", "copy": "2-3 sentence copy block" },
    { "angle": "Dream Angle", "hook": "headline from dream/aspiration perspective", "copy": "2-3 sentence copy block" },
    { "angle": "Identity Angle", "hook": "headline from who-they-want-to-be perspective", "copy": "2-3 sentence copy block" }
  ],
  "five_hooks": [
    "Hook 1 — pattern interrupt opener",
    "Hook 2 — curiosity gap hook",
    "Hook 3 — specific result hook",
    "Hook 4 — pain agitate hook",
    "Hook 5 — identity shift hook"
  ],
  "email_sequence": [
    { "day": 0, "subject": "email 1 subject", "preview": "preview text", "body_intro": "first 2 sentences of email body" },
    { "day": 1, "subject": "email 2 subject", "preview": "preview text", "body_intro": "first 2 sentences" },
    { "day": 3, "subject": "email 3 subject", "preview": "preview text", "body_intro": "first 2 sentences" },
    { "day": 5, "subject": "email 4 subject — last chance", "preview": "preview text", "body_intro": "first 2 sentences" }
  ],
  "whop_listing": {
    "title": "${title}",
    "description": "3-4 sentence Whop product listing description",
    "price": ${priceLow},
    "tags": ["tag1", "tag2", "tag3"]
  },
  "funnel_path": "Entry Product → Bridge Tool → Core Offer description in one sentence"
}`

  const raw = await chat(apiKey, [
    { role: 'system', content: UVZ_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ])

  const funnelData = tryJSON(raw)
  if (!funnelData?.landing_page) return c.json({ error: 'AI error', raw: raw.slice(0, 500) }, 500)

  const id = uid()
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO funnel_flows (id, project_id, funnel_type, steps_json, hooks_json, email_sequence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    project_id,
    'standard',
    JSON.stringify(funnelData),
    JSON.stringify(funnelData.five_hooks),
    JSON.stringify(funnelData.email_sequence),
    now
  ).run().catch(() => {})

  // Update products catalog
  await c.env.DB.prepare(
    'UPDATE products SET three_angle_offer = ?, hook_options = ?, funnel_path = ?, updated_at = ? WHERE id IN (SELECT id FROM products WHERE keyword IN (SELECT keyword FROM projects WHERE id = ?) LIMIT 1)'
  ).bind(
    JSON.stringify(funnelData.three_angle_offer),
    JSON.stringify(funnelData.five_hooks),
    funnelData.funnel_path,
    now,
    project_id
  ).run().catch(() => {})

  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?')
    .bind('complete', project_id).run().catch(() => {})

  return c.json({ funnel: { ...funnelData, id, project_id } })
})

funnel.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  const row = await c.env.DB.prepare(
    'SELECT * FROM funnel_flows WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(projectId).first<any>()

  if (!row) return c.json({ funnel: null })

  const stored = tryJSON(row.steps_json, {})
  const hooks = tryJSON(row.hooks_json, [])
  const emails = tryJSON(row.email_sequence_json, [])

  if (stored?.landing_page) return c.json({ funnel: { ...stored, id: row.id, project_id: row.project_id } })
  return c.json({ funnel: { id: row.id, project_id: row.project_id, landing_page: stored, five_hooks: hooks, email_sequence: emails } })
})

export default funnel
