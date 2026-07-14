// UVZ Funnel Forge — API Service
// All calls go to /api/* (same-origin Hono backend on Cloudflare Pages)

const API = '/api'

async function call(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('uvz_token') || ''
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  register: async (email: string, password: string) => {
    const d = await call('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (d.token) localStorage.setItem('uvz_token', d.token)
    return d
  },
  login: async (email: string, password: string) => {
    const d = await call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (d.token) localStorage.setItem('uvz_token', d.token)
    return d
  },
  logout: () => localStorage.removeItem('uvz_token'),
  me: () => call('/auth/me'),
  isLoggedIn: () => !!localStorage.getItem('uvz_token'),
}

export const locale = {
  get: () => call('/locale'),
  save: (value: string) => call('/locale', { method: 'PUT', body: JSON.stringify({ locale: value }) }),
}

export const assets = {
  list: (projectId: string) => call(`/assets/${projectId}`),
  upload: async (projectId: string, file: File) => {
    const token = localStorage.getItem('uvz_token') || ''
    const response = await fetch(`${API}/assets/${projectId}`, { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': file.name, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: file })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
    return data
  },
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  list: () => call('/projects'),
  get: (id: string) => call(`/projects/${id}`),
  create: (keyword: string, themeType?: string, themeValue?: string) =>
    call('/projects', { method: 'POST', body: JSON.stringify({ keyword, theme_type: themeType || undefined, theme_value: themeValue || undefined }) }),
  delete: (id: string) => call(`/projects/${id}`, { method: 'DELETE' }),
}

// ── Module 1 — UVZ Analyzer ──────────────────────────────────────────────────

export const uvz = {
  analyze: (projectId: string, keyword: string) =>
    call('/modules/uvz/analyze', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, keyword }),
    }),
  get: (projectId: string) => call(`/modules/uvz/${projectId}`),
}

// ── Module 2 — Product Format Generator ─────────────────────────────────────

export const product = {
  generate: (projectId: string, uvzText: string) =>
    call('/modules/product/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, uvz_text: uvzText }),
    }),
  get: (projectId: string) => call(`/modules/product/${projectId}`),
}

// ── Module 3 — Light Tool Builder ────────────────────────────────────────────

export const tools = {
  TYPES: ['calculator', 'quiz', 'planner', 'tracker', 'generator'] as const,
  build: (projectId: string, toolType: string, config: Record<string, any>) =>
    call('/modules/tools/build', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, tool_type: toolType, config }),
    }),
  get: (projectId: string) => call(`/modules/tools/${projectId}`),
}

// ── Module 4 — AI Chatbot ────────────────────────────────────────────────────

export const chatbot = {
  configure: (projectId: string, persona: string, productKnowledge: string) =>
    call('/modules/chatbot/configure', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, persona, product_knowledge: productKnowledge }),
    }),
  chat: (productId: string, message: string, sessionId: string) =>
    call('/modules/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, message, session_id: sessionId }),
    }),
  get: (projectId: string) => call(`/modules/chatbot/${projectId}`),
}

// ── Module 5 — Course Pack Maker ─────────────────────────────────────────────

export const course = {
  generate: (projectId: string) =>
    call('/modules/course/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),
  get: (projectId: string) => call(`/modules/course/${projectId}`),
}

// ── Module 6 — Funnel Builder ────────────────────────────────────────────────

export const funnel = {
  build: (projectId: string) =>
    call('/modules/funnel/build', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    }),
  get: (projectId: string) => call(`/modules/funnel/${projectId}`),
}

// ── Module 7 — Catalog & Analytics ──────────────────────────────────────────

export const catalog = {
  list: () => call('/catalog'),
  stats: () => call('/catalog/stats'),
  product: (id: string) => call(`/catalog/${id}`),
  trackEvent: (productId: string, eventType: string, metadata?: any) =>
    call('/catalog/event', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, event_type: eventType, metadata }),
    }),
}
