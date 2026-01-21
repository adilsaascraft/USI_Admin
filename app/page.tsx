import { redirect } from 'next/navigation'
import { getCookieHeader } from '@/lib/serverCookies'

export default async function Home() {
  const cookieHeader = await getCookieHeader()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
    {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    }
  )

  if (res.ok) {
    redirect('/dashboard')
  }

  redirect('/login')
}
