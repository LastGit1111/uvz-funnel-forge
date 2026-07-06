// Module 5 — Course Pack Maker
import { Hono } from 'hono'
import { chat, tryJSON, UVZ_SYSTEM_PROMPT } from '../../lib/ai'
import { uid } from '../../lib/auth'

type Env = { DB: D1Database; LAOZHANG_API_KEY: string; JWT_SECRET: string }
const course = new Hono<{ Bindings: Env }>()

course.post('/generate', async c => {
  const { project_id } = await c.req.json()
  if (!project_id) return c.json({ error: 'project_id required' }, 400)

  const apiKey = c.env.LAOZHANG_API_KEY
  if (!apiKey) return c.json({ error: 'LAOZHANG_API_KEY not configured' }, 503)

  // Load product data
  const productRow = await c.env.DB.prepare(
    'SELECT * FROM product_outlines WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(project_id).first<any>()
  const productData = tryJSON(productRow?.outline_json, {})

  // Load UVZ data
  const uvzRow = await c.env.DB.prepare(
    'SELECT * FROM uvz_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(project_id).first<any>()

  const uvzText = uvzRow?.selected_uvz || ''
  const title = productData?.title || 'Digital Product'
  const outline = productData?.outline || []
  const transformation = productData?.transformation || ''

  const prompt = `Create a complete course pack for this digital product:
Title: "${title}"
UVZ (Target Audience): "${uvzText}"
Transformation: "${transformation}"
Modules: ${JSON.stringify(outline)}

Return ONLY valid JSON:
{
  "course_title": "the full course title",
  "tagline": "one powerful sentence selling the transformation",
  "modules": [
    {
      "title": "Module 1: [exact title]",
      "lesson_count": 3,
      "lessons": [
        {
          "title": "Lesson 1.1: [specific title]",
          "script_intro": "first 2-3 sentences of the lesson script — hook and context",
          "key_points": ["point 1", "point 2", "point 3"],
          "worksheet_prompt": "one worksheet exercise for this lesson"
        }
      ],
      "module_summary": "1-2 sentences on what they can DO after this module"
    }
  ],
  "welcome_script": "The opening 3-sentence welcome message for the course",
  "completion_message": "The congratulations message after finishing",
  "upsell_bridge": "2-3 sentence bridge from course completion to next offer"
}`

  const raw = await chat(apiKey, [
    { role: 'system', content: UVZ_SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ])

  const courseData = tryJSON(raw)
  if (!courseData?.course_title) return c.json({ error: 'AI error', raw: raw.slice(0, 500) }, 500)

  const id = uid()
  const now = new Date().toISOString()

  // Store in user_progress table (reused for course storage)
  await c.env.DB.prepare(
    'INSERT OR REPLACE INTO user_progress (id, user_id, product_id, module_index, lesson_index, completed, score, metadata, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, project_id, project_id, 0, 0, 0, 100, JSON.stringify(courseData), now).run().catch(() => {})

  await c.env.DB.prepare('UPDATE projects SET status = ? WHERE id = ?')
    .bind('course-done', project_id).run().catch(() => {})

  return c.json({ course: { ...courseData, id, project_id } })
})

course.get('/:projectId', async c => {
  const projectId = c.req.param('projectId')
  const row = await c.env.DB.prepare(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'
  ).bind(projectId).first<any>()

  if (!row) return c.json({ course: null })
  const data = tryJSON(row.metadata, {})
  return c.json({ course: { ...data, id: row.id, project_id: row.user_id } })
})

export default course
