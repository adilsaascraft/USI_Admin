// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import ProtectedClientLayout from './ProtectedClientLayout'

async function getSession() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
    {
      credentials: 'include',
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

  // ✅ Pass through to client layout
  return <ProtectedClientLayout>{children}</ProtectedClientLayout>
}
