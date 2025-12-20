// src/app/(admin)/layout.tsx
import type { Metadata } from 'next'
import Sidebar from '@/components/Sidebar'
import DashboardNavbar from '@/components/DashboardNavbar'
import MobileNavbar from '@/components/MobileNavbar'
import { Poppins, Francois_One } from 'next/font/google'
import '@/styles/globals.css'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const francoisOne = Francois_One({
  variable: '--font-francois',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'USI Learning Software',
  description: 'Admin panel for managing usi learning management system',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Extra favicons for various devices */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
      </head>
      <body
        className={`${poppins.variable} ${francoisOne.variable} font-sans antialiased flex h-screen flex-col bg-background text-foreground`}
      >
        {/* ✅ Top Navbar (always visible) */}
        <DashboardNavbar />

        {/* ✅ Mobile Navbar (only visible on mobile & tablet) */}
        <div className="block lg:hidden sticky top-[56px] z-50">
          <MobileNavbar />
        </div>

        {/* ✅ Main layout (Sidebar + Content) */}
        <div className="flex flex-1">
          {/* Sidebar hidden on mobile/tablet */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
