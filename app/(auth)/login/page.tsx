import Image from 'next/image'
import { LoginForm } from '@/components/forms/LoginForm'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-svh flex-col bg-linear-to-r from-[#D8E8FB] to-white">
      {/* Navbar */}
      <nav
        className="flex items-center px-6 py-4"
        style={{
          // Navbar-specific gradient
          background:
            'linear-gradient(90deg, #BCF3FF 0%, #B4EBFE 11%, #B1E7FD 15%, #75A8F2 100%)',
        }}
      >
        <div className="flex items-center">
          <Image
            src="/usi_logo.png"
            alt="USI Logo"
            width={200}
            height={80}
            className="object-contain"
            priority
          />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <LoginForm />
        </div>
      </div>

      

      {/* ================= FOOTER ================= */}
      <Card className="rounded-none border-t bg-white/20 backdrop-blur-xl">
        <CardContent className="py-4">
          <div className="flex items-center justify-center text-center px-4 text-xs sm:text-sm text-gray-600">
            © Urological Society of India. All Rights Reserved. Learning Management System by SaaScraft Studio (India) Pvt. Ltd.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
