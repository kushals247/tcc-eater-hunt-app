import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export const SESSION_COOKIE_NAME = 'admin-session'

// Use secure cookies only when actually served over HTTPS.
// Basing this on NODE_ENV alone breaks HTTP access (e.g. before SSL is set up)
// because browsers store secure cookies but refuse to send them over HTTP.
const isHttps = (process.env.NEXT_PUBLIC_BASE_URL || '').startsWith('https://')

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isHttps,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

export type SessionPayload = {
  userId: string
  role: string
}

export async function createSession(userId: string, role: string): Promise<string> {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  return token
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (!payload.userId || !payload.role) return null
    return { userId: payload.userId as string, role: payload.role as string }
  } catch {
    return null
  }
}

export async function requireRole(allowed: string[]): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  if (!allowed.includes(session.role)) throw new Error('Forbidden')
  return session
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
