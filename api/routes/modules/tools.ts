// Module 3 — Light Tool Builder
// 5 base templates: Calculator, Quiz, Planner, Tracker, Generator
import { Hono } from 'hono'
import { chat, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const tools = new Hono<{ Bindings: Env }>()

const TOOL_SCHEMAS: Record<string, string> = {
  calculator: `{
    "type": "calculator",
    "name": "tool name",
    "description": "what it calculates and why users need it",
    "questions": ["input field 1 label", "input field 2 label", "input field 3 label"],
    "result_template": "Based on your inputs, [personalized insight and recommendation]",
    "upsell_trigger": "one sentence CTA after seeing results"
  }`,
  quiz: `{
    "type": "quiz",
    "name": "tool name",
    "description": "what the quiz reveals",
    "questions": [
      {"question": "q1", "options": ["a", "b", "c", "d"]},
      {"question": "q2", "options": ["a", "b", "c", "d"]},
      {"question": "q3", "options": ["a", "b", "c", "d"]}
    ],
    "result_template": "Based on your answers, your profile is [TYPE]: [insight and next step]",
    "upsell_trigger": "one sentence CTA"
  }`,
  planner: `{
    "type": "planner",
    "name": "tool name",
    "description": "what the planner helps achieve",
    "questions": ["goal input", "current situation", "timeline", "biggest obstacle"],
    "result_template": "Your personalized [X]-day plan: [key steps and milestones]",
    "upsell_trigger": "one sentence CTA"
  }`,
  tracker: `{
    "type": "tracker",
    "name": "tool name",
    "description": "what it tracks and why",
    "questions": ["metric 1 to track", "metric 2 to track", "frequency/period"],
    "result_template": "Your [period] progress summary: [insights and encouragement]",
    "upsell_trigger": "one sentence CTA"
  }`,
  generator: `{
    "type": "generator",
    "name": "tool name",
    "description": "what it generates",
    "questions": ["input 1", "input 2", "input 3", "style/preference"],
    "result_template": "Generated for you: [personalized output based on inputs]",
    "upsell_trigger": "one sentence CTA"
  }`,
}

tools.post('/build', async c => {
  const { project_id, tool_type, config } = await c.req.json()
  const type = (tool_type || 'quiz').toLowerCase()
  const schema = TOOL_SCHEMAS[type] || TOOL_SCHEMAS.quiz

  const uvz = config?.uvz || ''
  const productTitle = config?.product_title || ''

  const prompt = `Build a ${type} light tool for this product/UVZ context:
UVZ: "${uvz}"
Product: "${productTitle}"

This tool should deliver a PERSONALIZED result that makes the user feel seen and creates desire for the full product.

Return ONLY valid JSON matching this schema:
${schema}

IMPORTANT: 
- Name must be specific and benefit-focused (e.g. "The Driver Income Calculator" not "Calculator")
- Questions must feel natural and conversational, not corporate
- Result template must be personalized and create an 'aha moment'
- Upsell trigger must be natural, not pushy`

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured' }, 503)

  const raw = await chat(apiKey, [
    { role: 'system', content: UVZ_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ])
  const toolData = tryJSON(raw)
  if (!toolData?.name) return c.json({ error: 'AI error', raw: raw.slice(0, 500) }, 500)

  const id = uid()
  const now = new Date().toISOString()
  await c.env.DB.prepare('INSERT OR REPLACE INTO distribution_plans (id, project_id, platforms, seo_json, content_packs, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, project_id, type, JSON.stringify(toolData), JSON.stringify(config || {}), now).run().catch(() => {})

  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?').bind('tool-done', project_id).run().catch(() => {})

  return c.json({ tool: { ...toolData, id, project_id } })
})

tools.get('/:projectId', async c => {
  const row = await c.env.DB.prepare('SELECT * FROM distribution_plans WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').bind(c.req.param('projectId')).first<any>()
  if (!row) return c.json({ tool: null })
  const data = tryJSON(row.seo_json, {})
  return c.json({ tool: { ...data, id: row.id, type: row.platforms, project_id: row.project_id } })
})

export default tools
