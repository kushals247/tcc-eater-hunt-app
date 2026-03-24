import { NextRequest, NextResponse } from 'next/server'
import { createSession, setSessionCookie, clearSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 })
  }

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user || !user.isActive) {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createSession(user.id, user.role)
  await setSessionCookie(token)
  return NextResponse.json({ success: true, role: user.role })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  if (url.searchParams.get('logout') === '1') {
    await clearSession()
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
