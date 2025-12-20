'use client'

import { useState } from 'react'
import { apiRequest } from '@/lib/apiRequest'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>() // <-- grab token from URL
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

 // on submit function

 const onSubmit = async (data: ResetPasswordFormData) => {
  setIsLoading(true)
  setError('')
  setSuccess('')

  try {
    await apiRequest<
      { password: string },
      { message?: string }
    >({
      endpoint: `/api/admin/reset-password/${params.token}`,
      method: 'POST',
      body: {
        password: data.password,
      },
      showToast: false,
    })

    setSuccess('Your password has been successfully changed.')

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err: any) {
    setError(err?.message || 'Failed to reset password.')
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-[#D8E8FB] to-white px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-black">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* New Password */}
          <div className="grid gap-3 relative">
            <Label htmlFor="password" className='text-black'>Enter your new password</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full pr-10 text-black !bg-gray-100"
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="grid gap-3 relative">
            <Label htmlFor="confirmPassword" className='text-black'>Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              className="w-full pr-10 text-black !bg-gray-100"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((c) => !c)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && (
            <p className="text-green-600 text-sm text-center">{success}</p>
          )}

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
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
