import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value

  const protectedRoutes = [
    '/conference',
    '/courses',
    '/dashboard',
    '/speakers',
    '/webinar',
    '/users',
  ]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // 🔐 Protect private routes ONLY
  if (isProtected && !accessToken) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/conference/:path*',
    '/courses/:path*',
    '/dashboard/:path*',
    '/speakers/:path*',
    '/webinar/:path*',
    '/users/:path*',
  ],
}
