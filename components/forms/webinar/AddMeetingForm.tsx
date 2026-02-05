'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { MeetingSchema, MeetingValues } from '@/validations/meetingSchema'
import { FaHashtag, FaLink, FaRegEdit, FaShieldAlt} from 'react-icons/fa'
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
import { apiRequest } from '@/lib/apiRequest'

/* ================= PROPS ================= */

type Props = {
  webinarId: string
  defaultValues?: {
    _id: string
    meetingName: string
    meetingLink: string
    meetingId: string
    passCode: string
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
        meetingId: '',
        passCode: '',
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
        meetingId: defaultValues.meetingId,
        passCode: defaultValues.passCode,
      })
    }
  }, [defaultValues, webinarId, form])

  /* ================= SUBMIT ================= */
/* ================= SUBMIT ================= */
const onSubmit = async (data: z.infer<typeof MeetingSchema>) => {
  // 🔒 prevent double submit
  if (loading) return

  try {
    setLoading(true)

    const isEdit = Boolean(defaultValues?._id)

    const endpoint = isEdit
      ? `/api/admin/meetings/${defaultValues!._id}`
      : `/api/admin/meetings/${webinarId}`

    const method = isEdit ? 'PUT' : 'POST'

    await apiRequest<
      z.infer<typeof MeetingSchema>,
      any
    >({
      endpoint,
      method,
      body: data,
      showToast: true,
      successMessage: isEdit
        ? 'Meeting updated successfully!'
        : 'Meeting created successfully!',
    })

    // ✅ same post-success behavior
    onSave()
    clearDraft(DRAFT_KEY)

    form.reset({
      webinarId,
      meetingName: '',
      meetingLink: '',
      meetingId: '',
      passCode: '',
    })
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
                <FormLabel>Meeting Name (Topic Name) *</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="e.g. USI - ISU Webinar 10th February "
                    icon={<FaRegEdit />}
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
                    placeholder="https://us02web.zoom.us/j/8571676655?pwd......"
                    icon={<FaLink />}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meeting ID */}
          <FormField
            control={form.control}
            name="meetingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting ID (if any)</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="e.g. 857 1036 3803"
                    icon={<FaHashtag />}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meeting Passcode */}
          <FormField
            control={form.control}
            name="passCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting PassCode (if any)</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="e.g. 284568"
                    icon={<FaShieldAlt />}
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
