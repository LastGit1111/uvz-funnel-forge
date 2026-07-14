// UVZ Funnel Forge — Hono Worker
// Backend: Cloudflare Pages + D1 (uvz-funnel-db)
// AI: LaoZhang API (OpenAI-compatible)
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import uvzRoutes from './routes/modules/uvz'
import productRoutes from './routes/modules/product'
import toolRoutes from './routes/modules/tools'
import chatbotRoutes from './routes/modules/chatbot'
import courseRoutes from './routes/modules/course'
import funnelRoutes from './routes/modules/funnel'
import catalogRoutes from './routes/catalog'
import localeRoutes from './routes/locale'

type Env = {
  DB: D1Database
  ASSETS: Fetcher
  LAOZHANG_API_KEY: string
  JWT_SECRET: string
  ADMIN_SECRET?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: ['https://uvz-funnel-forge.pages.dev', 'https://uvz-funnel-forge.shermanmonte1111.workers.dev', 'http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ═══ NOVA BRAIN CONNECTION ENDPOINTS ═══
app.get('/health', c => c.json({ ok: true, status: 'ok', service: 'uvz-funnel-forge', version: '1.0.0' }))

app.get('/api/status', c => c.json({
  app_name: 'uvz-funnel-forge',
  training_loaded: true,
  last_task_at: new Date().toISOString(),
  errors: []
}))

app.get('/api/info', c => c.json({
  app_name: 'uvz-funnel-forge',
  api_url: 'https://uvz-funnel-forge.pages.dev',
  frontend_url: 'https://uvz-funnel-forge.pages.dev',
  cf_worker_name: 'uvz-funnel-forge',
  cf_pages_project: 'uvz-funnel-forge',
  cf_d1_name: 'uvz-funnel-db',
  openapi_url: '/openapi.json',
  auth_method: 'bearer',
  auth_header_name: 'Authorization',
  capabilities: [
    'uvz_analysis',
    'product_generation',
    'light_tool_builder',
    'ai_chatbot_advisor',
    'course_pack_maker',
    'funnel_builder',
    'catalog_analytics',
    'ai_chat',
    'receive_tasks',
    'return_status'
  ],
  ingest_endpoint: 'POST /api/ingest',
  health_endpoint: 'GET /health',
  status_endpoint: 'GET /api/status',
  ready: true
}))

app.post('/api/ingest', async c => {
  const body = await c.req.text()
  let parsed = false
  try { JSON.parse(body); parsed = true } catch {}
  const ingest_id = 'ing_' + crypto.randomUUID()

  try {
    await c.env.DB?.prepare(
      'INSERT INTO brain_ingest (id, body, received_at) VALUES (?, ?, ?)'
    ).bind(ingest_id, body, new Date().toISOString()).run()
  } catch {}

  return c.json({ ok: true, received_bytes: body.length, parsed, ingest_id })
})
// ═══ END NOVA ENDPOINTS ═══

app.route('/api/auth', authRoutes)
app.route('/api/projects', projectRoutes)
app.route('/api/modules/uvz', uvzRoutes)
app.route('/api/modules/product', productRoutes)
app.route('/api/modules/tools', toolRoutes)
app.route('/api/modules/chatbot', chatbotRoutes)
app.route('/api/modules/course', courseRoutes)
app.route('/api/modules/funnel', funnelRoutes)
app.route('/api/catalog', catalogRoutes)
app.route('/api/locale', localeRoutes)

// Serve built React assets through Cloudflare Pages' native asset binding.
app.get('*', c => c.env.ASSETS.fetch(c.req.raw))

export default app
