// Module 4 — AI Chatbot Advisor
import { Hono } from 'hono'
import { chat, chatText, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const chatbot = new Hono<{ Bindings: Env }>()

// Configure chatbot persona for a product
chatbot.post('/configure', async c => {
  const { project_id, persona, product_knowledge } = await c.req.json()
  if (!project_id) return c.json({ error: 'project_id required' }, 400)

  // Pull product data from DB to build a full system prompt
  const productRow = await c.env.DB.prepare(
    'SELECT * FROM product_outlines WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(project_id).first<any>()

  const productData = tryJSON(productRow?.outline_json, {})
  const personaName = persona || productData?.persona || 'Alex — a direct, results-driven digital product coach'
  const knowledge = product_knowledge || productData?.title || ''

  const systemPrompt = `You are ${personaName}.
Your product: "${knowledge}"
Transformation you deliver: "${productData?.transformation || ''}"

RULES:
1. Always be warm, direct, and specific.
2. After answering, naturally mention how the product helps with their situation.
3. Never be pushy — create desire through insight.
4. End every 3rd message with a soft upsell: reference the product and its price.
5. Keep replies under 150 words unless they ask for detail.`

  const id = uid()
  const now = new Date().toISOString()

  // Store in faqs table (re-used for chatbot config storage)
  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO faqs (id, project_id, question, answer, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, project_id, '__chatbot_config__', systemPrompt, now).run().catch(() => {})

  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?')
    .bind('chatbot-done', project_id).run().catch(() => {})

  return c.json({ chatbot: { id, project_id, persona: personaName, system_prompt: systemPrompt } })
})

// Chat endpoint — stateless with session history in request
chatbot.post('/chat', async c => {
  const { product_id, message, session_id, history } = await c.req.json()
  if (!message) return c.json({ error: 'message required' }, 400)

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured' }, 503)

  // Try to load chatbot config (system prompt) for this product/project
  const configRow = await c.env.DB.prepare(
    "SELECT answer FROM faqs WHERE project_id = ? AND question = '__chatbot_config__' ORDER BY created_at DESC LIMIT 1"
  ).bind(product_id).first<any>()

  // Load product info as fallback context
  const productRow = await c.env.DB.prepare(
    'SELECT * FROM product_outlines WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(product_id).first<any>()
  const productData = tryJSON(productRow?.outline_json, {})

  const systemPrompt = configRow?.answer || `You are an expert AI advisor for the product "${productData?.title || 'this digital product'}". 
  Help users with questions, give genuine value, and naturally mention how the product can help them. Be conversational and warm. Keep replies concise.`

  // Build messages array with history
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt }
  ]

  // Include last 6 history messages to save tokens
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6)
    messages.push(...recent.map((h: any) => ({ role: h.role, content: h.content })))
  }

  messages.push({ role: 'user', content: message })

  const reply = await chatText(apiKey, messages)

  // Store conversation in DB
  const sessId = session_id || uid()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO conversations (id, product_id, session_id, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(uid(), product_id, sessId, JSON.stringify([{ role: 'user', content: message }, { role: 'assistant', content: reply }]), now, now)
    .run().catch(() => {})

  // Track analytics event
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO analytics (id, product_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(uid(), product_id, 'chat', JSON.stringify({ session_id: sessId }), now).run().catch(() => {})

  return c.json({ reply, session_id: sessId })
})

// Get chatbot config for a project
chatbot.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  const row = await c.env.DB.prepare(
    "SELECT * FROM faqs WHERE project_id = ? AND question = '__chatbot_config__' ORDER BY created_at DESC LIMIT 1"
  ).bind(projectId).first<any>()

  if (!row) return c.json({ chatbot: null })
  return c.json({ chatbot: { id: row.id, project_id: row.project_id, system_prompt: row.answer } })
})

export default chatbot
