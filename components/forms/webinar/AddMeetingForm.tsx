'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { MeetingSchema, MeetingValues } from '@/validations/meetingSchema'
import { FaVideo } from 'react-icons/fa'
import InputWithIcon from '@/components/InputWithIcon'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  useForm,
  zodResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/imports'

import { Button, SheetClose, toast } from '@/lib/imports'

import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= PROPS ================= */

type Props = {
  webinarId: string
  defaultValues?: {
    _id: string
    meetingName: string
    meetingLink: string
  }
  onSave: () => void
}

/* ================= COMPONENT ================= */

export default function AddMeetingForm({
  webinarId,
  defaultValues,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-meeting-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const courseDraft = drafts[DRAFT_KEY]
  const form = useForm<MeetingValues>({
    resolver: zodResolver(MeetingSchema),
    defaultValues: defaultValues ||
      courseDraft || {
        webinarId,
        meetingName: '',
        meetingLink: '',
      },
  })

  // ================= DRAFT PERSIST =================
  useEffect(() => {
    if (defaultValues?._id) return

    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values)
    })

    return () => subscription.unsubscribe()
  }, [form.watch, defaultValues?._id])

  /* ---------- Edit Mode Prefill ---------- */
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        webinarId,
        meetingName: defaultValues.meetingName,
        meetingLink: defaultValues.meetingLink,
      })
    }
  }, [defaultValues, webinarId, form])

  /* ================= SUBMIT ================= */

  const onSubmit = async (data: z.infer<typeof MeetingSchema>) => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      if (!token) throw new Error('Unauthorized')

      const isEdit = Boolean(defaultValues?._id)

      const endpoint = isEdit
        ? `/api/admin/meetings/${defaultValues!._id}`
        : `/api/admin/meetings/${webinarId}`

      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(
        isEdit
          ? 'Meeting updated successfully!'
          : 'Meeting created successfully!',
        { description: getIndianFormattedDate() }
      )

      onSave()
      form.reset({ webinarId, meetingName: '', meetingLink: '' })
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-4 p-4"
        >
          {/* Meeting Name */}
          <FormField
            control={form.control}
            name="meetingName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Name *</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="e.g. Zoom Orientation Session"
                    icon={<FaVideo />}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meeting Link */}
          <FormField
            control={form.control}
            name="meetingLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Link *</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="https://zoom.us/..."
                    icon={<FaVideo />}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* ---------- Footer ---------- */}
      <div className="border-t p-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
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
