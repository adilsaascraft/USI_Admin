import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/webinar',
  '/speakers',
  '/users',
  '/courses',
  '/conference',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  )

  if (!isProtected) return NextResponse.next()

  // ✅ SERVER-ONLY ENV VAR
  const apiUrl = process.env.ADMIN_API_URL

  if (!apiUrl) {
    console.error('ADMIN_API_URL is missing')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const res = await fetch(`${apiUrl}/api/admin/me`, {
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  })

  if (res.status !== 200) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/webinar/:path*',
    '/speakers/:path*',
    '/users/:path*',
    '/courses/:path*',
    '/conference/:path*',
  ],
}
