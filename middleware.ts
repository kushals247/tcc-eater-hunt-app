import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

async function getSessionPayload(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname.startsWith('/api/admin/auth')) return NextResponse.next()

  const token = request.cookies.get('admin-session')?.value

  // Login page: redirect authenticated users to their home
  if (pathname === '/admin/login') {
    if (token) {
      const session = await getSessionPayload(token)
      if (session) {
        const dest = session.role === 'VOUCHER_STAFF' ? '/admin/vouchers' : '/admin'
        return NextResponse.redirect(new URL(dest, request.url))
      }
    }
    return NextResponse.next()
  }

  // All other admin routes: require auth
  if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))

  const session = await getSessionPayload(token)
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url))

  // VOUCHER_STAFF can only access /admin/vouchers
  if (session.role === 'VOUCHER_STAFF' && !pathname.startsWith('/admin/vouchers')) {
    return NextResponse.redirect(new URL('/admin/vouchers', request.url))
  }

  // /admin/users is ADMIN only
  if (pathname.startsWith('/admin/users') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
