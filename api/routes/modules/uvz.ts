// Module 1 — UVZ Analyzer
// Input: keyword → Output: 10 Layer-3 UVZs, scored, best selected
import { Hono } from 'hono'
import { chat, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const uvz = new Hono<{ Bindings: Env }>()

uvz.post('/analyze', async c => {
  const { project_id, keyword } = await c.req.json()
  if (!project_id || !keyword) return c.json({ error: 'project_id and keyword required' }, 400)

  const prompt = `Analyze this keyword using the UVZ framework: "${keyword}"

Return ONLY valid JSON with this exact structure:
{
  "layer1": "the broad industry",
  "layer2": "the sub-market niche",
  "options": [
    {
      "uvz_text": "ultra-specific UVZ sentence with WHO + CONTEXT + TRANSFORMATION",
      "scores": {
        "buyer_power": 8,
        "urgency": 9,
        "competition": 7,
        "product_fit": 10
      },
      "notes": "one sentence on why this scores this way"
    }
  ],
  "selected_uvz": "the best UVZ option text (copy exactly from options)",
  "selection_reason": "1-3 sentences explaining why this UVZ wins",
  "recommended_product_format": "PDF guide | flipbook | short course | calculator tool | quiz tool | tracker | planner | chatbot advisor",
  "price_recommendation": "$7-$27"
}

Generate exactly 10 options. Make each UVZ ULTRA-SPECIFIC — include WHO, CONTEXT, and TRANSFORMATION. The money lives in Layer 3 specificity.`

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured. Add via wrangler secret put.' }, 503)

  const raw = await chat(apiKey, [
    { role: 'system', content: UVZ_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ])
  const analysis = tryJSON(raw)
  if (!analysis?.layer1) return c.json({ error: 'AI returned invalid response', raw: raw.slice(0, 500) }, 500)

  // Persist to D1
  const id = uid()
  const now = new Date().toISOString()
  await c.env.DB.prepare('INSERT OR REPLACE INTO uvz_analyses (id, project_id, uvz_options, selected_uvz, scores, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, project_id, JSON.stringify(analysis.options), analysis.selected_uvz, JSON.stringify(analysis.options.map((o: any) => o.scores)), now).run().catch(() => {})
  
  // Update project status
  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?').bind('uvz-done', project_id).run().catch(() => {})

  // Also persist to products table for catalog
  const productId = uid()
  await c.env.DB.prepare(`INSERT OR IGNORE INTO products (id, keyword, layer1, layer2, best_uvz, layer3_options, scoring_table, full_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(productId, keyword, analysis.layer1, analysis.layer2, analysis.selected_uvz, JSON.stringify(analysis.options), JSON.stringify(analysis.options.map((o: any) => o.scores)), raw, now, now).run().catch(() => {})

  return c.json({ analysis: { ...analysis, project_id, id } })
})

uvz.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  const row = await c.env.DB.prepare('SELECT * FROM uvz_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').bind(projectId).first<any>()
  if (!row) return c.json({ analysis: null })
  const options = tryJSON(row.uvz_options, [])
  const scores = tryJSON(row.scores, [])
  return c.json({ analysis: { options, selected_uvz: row.selected_uvz, scores, project_id: row.project_id, id: row.id } })
})

export default uvz
