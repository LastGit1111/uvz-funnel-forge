// JWT Auth helpers using Web Crypto (no Node.js deps)
export function uid(): string {
  return crypto.randomUUID()
}

const PBKDF2_ITERATIONS = 210_000
const encoder = new TextEncoder()

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromB64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0))
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256)
}

/** Salted, slow password hash. The encoded format is intentionally self-describing. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt.buffer)}$${b64(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length === 4 && parts[0] === 'pbkdf2') {
    const iterations = Number(parts[1])
    if (!Number.isInteger(iterations) || iterations < 100_000) return false
    const actual = new Uint8Array(await pbkdf2(password, fromB64(parts[2]), iterations))
    const expected = fromB64(parts[3])
    if (actual.length !== expected.length) return false
    let mismatch = 0
    for (let i = 0; i < actual.length; i++) mismatch |= actual[i] ^ expected[i]
    return mismatch === 0
  }
  // One-release compatibility path for accounts created before salted hashes.
  const legacy = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const hex = Array.from(new Uint8Array(legacy)).map(b => b.toString(16).padStart(2, '0')).join('')
  return stored.length === hex.length && stored === hex
}

export function isLegacyPasswordHash(stored: string): boolean {
  return !stored.startsWith('pbkdf2$')
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
