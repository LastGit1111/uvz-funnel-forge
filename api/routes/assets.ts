import { Hono } from 'hono'
import { getBearer, uid, verifyJWT } from '../lib/auth'

type Env = { DB: D1Database; ASSETS_BUCKET: R2Bucket; JWT_SECRET: string }
const assets = new Hono<{ Bindings: Env }>()
const maxUploadBytes = 10 * 1024 * 1024

async function ownedProject(c: any, projectId: string) {
  const token = getBearer(c.req.header('Authorization'))
  const user = token && c.env.JWT_SECRET && await verifyJWT(token, c.env.JWT_SECRET)
  if (!user || user.is_guest) return null
  return c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(projectId, user.sub).first()
}

function filename(value: string | undefined) {
  const sanitized = (value || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return sanitized || 'upload'
}

assets.post('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  if (!await ownedProject(c, projectId)) return c.json({ error: 'Unauthorized' }, 401)
  const length = Number(c.req.header('Content-Length') || 0)
  if (length > maxUploadBytes) return c.json({ error: 'Files must be 10 MB or smaller' }, 413)
  if (!c.req.raw.body) return c.json({ error: 'File body required' }, 400)

  const originalName = filename(c.req.header('X-File-Name'))
  const key = `projects/${projectId}/${uid()}-${originalName}`
  const uploaded = await c.env.ASSETS_BUCKET.put(key, c.req.raw.body, {
    httpMetadata: { contentType: c.req.header('Content-Type') || 'application/octet-stream' },
    customMetadata: { projectId, originalName },
  })
  return c.json({ asset: { key, name: originalName, size: uploaded?.size || length, uploaded_at: uploaded?.uploaded?.toISOString() } }, 201)
})

assets.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  if (!await ownedProject(c, projectId)) return c.json({ error: 'Unauthorized' }, 401)
  const listed = await c.env.ASSETS_BUCKET.list({ prefix: `projects/${projectId}/`, include: ['httpMetadata', 'customMetadata'], limit: 100 })
  return c.json({ assets: listed.objects.map(object => ({ key: object.key, name: object.customMetadata?.originalName || object.key.split('/').pop(), size: object.size, uploaded_at: object.uploaded.toISOString(), content_type: object.httpMetadata?.contentType })) })
})

assets.get('/:projectId/download', async c => {
  const projectId = c.req.param('projectId')
  if (!await ownedProject(c, projectId)) return c.json({ error: 'Unauthorized' }, 401)
  const key = c.req.query('key')
  if (!key?.startsWith(`projects/${projectId}/`)) return c.json({ error: 'Invalid asset key' }, 400)
  const object = await c.env.ASSETS_BUCKET.get(key)
  if (!object) return c.json({ error: 'Not found' }, 404)
  return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filename(object.customMetadata?.originalName)}"` } })
})

export default assets
