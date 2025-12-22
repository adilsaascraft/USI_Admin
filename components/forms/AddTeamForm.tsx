'use client'

import React, { useEffect, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { UserFormSchema, UserFormValues } from '@/validations/userSchema'
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaGlobe,
} from 'react-icons/fa'
import InputWithIcon from '@/components/InputWithIcon'
import {
  zodResolver,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/imports'
import { Button, SheetClose, toast } from '@/lib/imports'
import { fetchClient } from '@/lib/fetchClient'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

type AddUserFormProps = {
  defaultValues?: UserFormValues & { _id?: string }
  onSave: (formData: UserFormValues & { _id?: string }) => Promise<void>
}

export default function AddUserForm({
  defaultValues,
  onSave,
}: AddUserFormProps) {
  const [loading, setLoading] = useState(false)

  const DRAFT_KEY = 'add-user-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const userDraft = drafts[DRAFT_KEY]

  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: defaultValues ||
      userDraft || {
        prefix: '',
        name: '',
        email: '',
        mobile: '',
        qualification: '',
        affiliation: '',
        country: '',
      },
  })

  // ✅ Persist draft only in Add mode
  useEffect(() => {
    if (defaultValues?._id) return

    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values)
    })

    return () => subscription.unsubscribe()
  }, [form.watch, defaultValues?._id])

  async function onSubmit(data: UserFormValues & { _id?: string }) {
    try {
      setLoading(true)

      const url = defaultValues?._id
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/register/${defaultValues._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`

      const method = defaultValues?._id ? 'PUT' : 'POST'

      const res = await fetchClient(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to save user')

      toast.success(
        defaultValues?._id
          ? 'User updated successfully!'
          : 'User created successfully!',
        { description: getIndianFormattedDate() }
      )

      onSave?.(result.data)
      form.reset()
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto custom-scroll">
        <Form {...form}>
          <form
            id="add-user-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pl-3 pr-3"
          >
            {/* Prefix */}
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefix *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Mr / Ms / Dr"
                      icon={<FaUser />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Enter full name"
                      icon={<FaUser />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Enter email address"
                      icon={<FaEnvelope />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile */}
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Enter mobile number"
                      icon={<FaPhone />}
                      onInput={(e) => {
                        const input = e.currentTarget
                        input.value = input.value
                          .replace(/\D/g, '')
                          .slice(0, 10)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Qualification */}
            <FormField
              control={form.control}
              name="qualification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Enter qualification"
                      icon={<FaGraduationCap />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Affiliation */}
            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliation</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Enter affiliation"
                      icon={<FaUser />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Enter country"
                      icon={<FaGlobe />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button
            type="button"
            variant="outline"
            className="border border-gray-400"
            disabled={loading}
          >
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="add-user-form"
          disabled={loading}
          className="bg-sky-800 text-white hover:bg-sky-900"
        >
          {loading
            ? defaultValues
              ? 'Updating...'
              : 'Creating...'
            : defaultValues
            ? 'Update'
            : 'Create'}
        </Button>
      </div>
    </div>
  )
}
