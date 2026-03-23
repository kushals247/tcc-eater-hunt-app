import { NextRequest, NextResponse } from 'next/server'
import { createSession, setSessionCookie, clearSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Handle logout
  const url = new URL(req.url)
  if (url.searchParams.get('logout') === '1') {
    await clearSession()
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  const body = await req.json().catch(() => ({}))
  const { password } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  }

  const token = await createSession()
  const response = NextResponse.json({ success: true })
  await setSessionCookie(token)
  return response
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get('logout') === '1') {
    await clearSession()
    const response = NextResponse.redirect(new URL('/admin/login', req.url))
    return response
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
