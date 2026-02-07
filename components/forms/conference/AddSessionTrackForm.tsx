'use client'

import React, { useEffect, useState } from 'react'
import {
  SessionTrackSchema,
  SessionTrackValues,
} from '@/validations/trackSchema'
import { z } from 'zod'
import { FaUserPlus } from 'react-icons/fa'
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
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetClose,
  toast,
  status,
} from '@/lib/imports'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { apiRequest } from '@/lib/apiRequest'

/* ================= TYPES ================= */

type AddTrackFormProps = {
  conferenceId: string
  defaultValues?: Partial<SessionTrackValues & { _id: string }>
  onSave: (entry: SessionTrackValues & { _id: string }) => void
}

/* ================= COMPONENT ================= */

export default function AddSessionTrackForm({
  conferenceId,
  defaultValues,
  onSave,
}: AddTrackFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<SessionTrackValues>({
    resolver: zodResolver(SessionTrackSchema),
    defaultValues: {
      trackName: '',
      status: 'Active',
      ...defaultValues,
    },
  })

  /* ================= EFFECT ================= */

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    } else {
      form.reset({ ...form.getValues(), status: 'Active' })
    }
  }, [defaultValues, form])

  /* ================= SUBMIT ================= */

const onSubmit = async (values: z.infer<typeof SessionTrackSchema>) => {
  if (loading) return // ✅ double-click guard

  try {
    setLoading(true)

    const isEdit = Boolean(defaultValues?._id)

    const result = await apiRequest<
      z.infer<typeof SessionTrackSchema>,
      { data: SessionTrackValues & { _id: string } }
    >({
      endpoint: isEdit
        ? `/api/admin/tracks/${defaultValues!._id}`
        : `/api/admin/conferences/${conferenceId}/tracks`,
      method: isEdit ? 'PUT' : 'POST',
      body: values,
      showToast: false,
    })

    toast.success(
      isEdit
        ? 'Session Track updated successfully!'
        : 'Session Track created successfully!',
      { description: getIndianFormattedDate() }
    )

    onSave?.(result.data) // ✅ backend source of truth
    form.reset()
  } catch (err: any) {
    toast.error(err.message || 'Something went wrong ❌')
  } finally {
    setLoading(false)
  }
}


  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto custom-scroll">
        <Form {...form}>
          <form
            id="track-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pr-3 pl-3"
          >
            {/* Track Name */}
            <FormField
              control={form.control}
              name="trackName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Track Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Type session track name e.g. Track A"
                      icon={<FaUserPlus />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select status type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {status.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Footer */}
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
          form="track-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? defaultValues?._id
              ? 'Updating...'
              : 'Creating...'
            : defaultValues?._id
            ? 'Update'
            : 'Create'}
        </Button>
      </div>
    </div>
  )
}
