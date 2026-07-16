// UVZ Funnel Forge — Hono Worker
// Backend: Cloudflare Pages + D1 (uvz-funnel-db)
// AI: LaoZhang API (OpenAI-compatible)
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requireAuth } from './middleware/auth'
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
import assetRoutes from './routes/assets'
import adminRoutes from './routes/admin'

type Env = {
  DB: D1Database
  ASSETS: Fetcher
  ASSETS_BUCKET: R2Bucket
  LAOZHANG_API_KEY: string
  JWT_SECRET: string
  ADMIN_SECRET?: string
  INGEST_SECRET?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: ['https://uvz.thebesttrendingnow.com', 'https://uvz-funnel-forge.pages.dev', 'http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Ingest-Key'],
}))

app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'")
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
})

app.onError((error, c) => {
  console.error(JSON.stringify({ event: 'request_error', path: new URL(c.req.url).pathname, message: error.message }))
  return c.json({ error: 'Internal server error', request_id: c.req.header('CF-Ray') || crypto.randomUUID() }, 500)
})

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
  api_url: 'https://uvz.thebesttrendingnow.com',
  frontend_url: 'https://uvz.thebesttrendingnow.com',
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
  const secret = c.env.INGEST_SECRET
  if (!secret || c.req.header('X-Ingest-Key') !== secret) return c.json({ error: 'Unauthorized' }, 401)
  const declaredLength = Number(c.req.header('Content-Length') || 0)
  if (declaredLength > 64 * 1024) return c.json({ error: 'Payload too large' }, 413)
  if (!c.req.header('Content-Type')?.includes('application/json')) return c.json({ error: 'Content-Type must be application/json' }, 415)
  const reader = c.req.raw.body?.getReader()
  if (!reader) return c.json({ error: 'Request body required' }, 400)
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 64 * 1024) return c.json({ error: 'Payload too large' }, 413)
    chunks.push(value)
  }
  const merged = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }
  const body = new TextDecoder().decode(merged)
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
app.use('/api/projects/*', requireAuth)
app.use('/api/modules/*', requireAuth)
app.use('/api/modules/*', async (c, next) => {
  const user = c.get('user' as never) as { sub?: string } | undefined
  let projectId: string | undefined
  const path = new URL(c.req.url).pathname
  // Runtime chatbot conversations use a public product id rather than a project id.
  if (path.endsWith('/chat')) return next()
  if (c.req.method === 'GET') {
    projectId = new URL(c.req.url).pathname.split('/').pop()
  } else if (c.req.header('Content-Type')?.includes('application/json')) {
    try { projectId = (await c.req.raw.clone().json() as { project_id?: string }).project_id } catch { /* handled by route */ }
  }
  if (!projectId || !user?.sub) return c.json({ error: 'project_id is required' }, 400)
  const owned = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, user.sub).first()
  if (!owned) return c.json({ error: 'Project not found' }, 404)
  await next()
})
app.use('/api/assets/*', requireAuth)
app.use('/api/admin/*', requireAuth)
app.route('/api/projects', projectRoutes)
app.route('/api/modules/uvz', uvzRoutes)
app.route('/api/modules/product', productRoutes)
app.route('/api/modules/tools', toolRoutes)
app.route('/api/modules/chatbot', chatbotRoutes)
app.route('/api/modules/course', courseRoutes)
app.route('/api/modules/funnel', funnelRoutes)
app.route('/api/catalog', catalogRoutes)
app.route('/api/locale', localeRoutes)
app.route('/api/assets', assetRoutes)
app.route('/api/admin', adminRoutes)

// Serve built React assets through Cloudflare Pages' native asset binding.
app.get('*', c => c.env.ASSETS.fetch(c.req.raw))

export default app
