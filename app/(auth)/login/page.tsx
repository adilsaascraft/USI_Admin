'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'

import { apiRequest } from '@/lib/apiRequest'
import { useAuthStore } from '@/stores/authStore'
import { loginSchema, LoginFormData } from '@/validations/loginSchema'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginResponse {
  message: string
}

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, hydrate } = useAuthStore()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 🔐 Check session when visiting login page
  useEffect(() => {
    hydrate()
  }, [])

  // 🚀 If already logged in → dashboard
  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.replace('/webinar')
    }
  }, [isLoading, isAuthenticated])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // 🔑 Login submit
  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setSubmitting(true)

    try {
      await apiRequest<LoginFormData, LoginResponse>({
        endpoint: '/api/admin/login',
        method: 'POST',
        body: data,
      })

      // 🔐 Fetch session after login
      await hydrate()

      router.replace('/webinar')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ⛔ Prevent flicker
  if (isLoading) return null

  return (
    <div className="relative flex min-h-svh flex-col bg-linear-to-r from-[#D8E8FB] to-white">
      {/* Navbar */}
      <nav
        className="flex items-center px-6 py-4"
        style={{
          background:
            'linear-gradient(90deg, #BCF3FF 0%, #B4EBFE 11%, #B1E7FD 15%, #75A8F2 100%)',
        }}
      >
        <Image
          src="/usi_logo.png"
          alt="USI Logo"
          width={200}
          height={80}
          className="object-contain"
          priority
        />
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <div className={cn('flex flex-col gap-6')}>
            <Card className="overflow-hidden p-0 bg-[#FBFBFB]">
              <CardContent className="grid p-0 md:grid-cols-2">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-orange-700">
                        Admin Login
                      </h1>
                      <p className="text-muted-foreground">
                        Welcome back! Login to continue.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Label className="text-black">Email</Label>
                      <Input
                        type="email"
                        className="!bg-gray-100 text-black"
                        placeholder="Enter your email"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 relative">
                      <div className="flex items-center">
                        <Label className="text-black">Password</Label>
                        <a
                          href="/forgot-password"
                          className="ml-auto text-sm underline hover:underline text-black"
                        >
                          Forgot your password?
                        </a>
                      </div>

                      <Input
                        type={showPassword ? 'text' : 'password'}
                        className="!bg-gray-100 pr-10 text-black"
                        placeholder="Enter your password"
                        {...register('password')}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>

                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {submitting ? 'Authenticating...' : 'Login'}
                    </Button>

                    <div className="mt-4 text-center text-sm text-gray-600">
                      Educational Grant By
                      <Image
                        src="/logo.png"
                        alt="USI Logo"
                        width={220}
                        height={60}
                        className="mx-auto mt-2 object-contain"
                        priority
                      />
                    </div>
                  </div>
                </form>

                <div className="relative hidden md:block">
                  <Image
                    src="/usi.png"
                    alt="login image"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Card className="rounded-none border-t bg-white/20 backdrop-blur-xl">
        <CardContent className="py-4 text-center text-xs text-gray-600">
          © Urological Society of India. All Rights Reserved. Learning
          Management System by SaaScraft Studio (India) Pvt. Ltd.
        </CardContent>
      </Card>
    </div>
  )
}
