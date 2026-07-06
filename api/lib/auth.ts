// JWT Auth helpers using Web Crypto (no Node.js deps)
export function uid(): string {
  return crypto.randomUUID()
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  )
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function signJWT(payload: Record<string, any>, secret: string, expiresInHours = 168): Promise<string> {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600
  const body = b64url(new TextEncoder().encode(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`))
  return `${header}.${body}.${b64url(sig)}`
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [header, body, sig] = token.split('.')
    const key = await getKey(secret)
    const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)), new TextEncoder().encode(`${header}.${body}`))
    if (!valid) return null
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}

export function getBearer(authHeader: string | null | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
