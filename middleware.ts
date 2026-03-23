import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Skip auth for the API auth route
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin-session')?.value

  // On the login page: if already authenticated, redirect to dashboard
  if (pathname === '/admin/login') {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.redirect(new URL('/admin', request.url))
      } catch {
        // Invalid token — let them see login page
      }
    }
    return NextResponse.next()
  }

  // All other /admin/** routes: require auth
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
