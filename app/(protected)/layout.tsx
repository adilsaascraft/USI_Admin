import { redirect } from 'next/navigation'
import ProtectedClientLayout from './ProtectedClientLayout'
import { getCookieHeader } from '@/lib/serverCookies'

async function getSession() {
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

  if (!res.ok) return null
  return res.json()
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.authenticated) {
    redirect('/login')
  }

  return <ProtectedClientLayout>{children}</ProtectedClientLayout>
}
