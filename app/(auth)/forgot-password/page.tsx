'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/apiRequest'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // on submit function 

  const onSubmit = async (data: ForgotPasswordFormData) => {
  setError('')
  setSuccess('')
  setIsLoading(true)

  try {
    const response = await apiRequest<
      { email: string },
      { message?: string }
    >({
      endpoint: '/api/admin/forgot-password',
      method: 'POST',
      body: {
        email: data.email,
      },
      showToast: false, // optional
    })

    setSuccess(
      response.message || 'Password reset link sent to your email.'
    )
    reset()

    // Optional redirect
    setTimeout(() => {
      router.push('/login')
    }, 5000)
  } catch (err: any) {
    setError(err?.message || 'Failed to send reset link.')
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-[#D8E8FB] to-white px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-black">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              className="w-full  text-black !bg-gray-100"
              placeholder="enter your email id"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full px-4 py-2 rounded-md
              bg-orange-600
              text-white font-medium
              transition-all duration-200
              hover:bg-orange-700
              active:scale-[0.97]
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? (
              <>
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span>
                </span>
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div
          className="text-sm mt-4 text-center text-orange-700 hover:underline cursor-pointer"
          onClick={() => router.push('/login')}
        >
          Back to Login
        </div>
      </div>
    </div>
  )
}
