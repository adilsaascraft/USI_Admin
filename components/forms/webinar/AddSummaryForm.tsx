'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { SummarySchema, SummaryValues } from '@/validations/summarySchema'
import { FaRobot } from 'react-icons/fa'
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
import { Textarea } from '@/components/ui/textarea'
import RichTextEditor from '@/components/RichTextEditor'

/* ================= PROPS ================= */

type Props = {
  webinarId: string
  defaultValues?: {
    _id: string
    summary: string
  }
  onSave: () => void
}

/* ================= COMPONENT ================= */

export default function AddSummaryForm({
  webinarId,
  defaultValues,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-summary-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const summaryDraft = drafts[DRAFT_KEY]

  const form = useForm<SummaryValues>({
    resolver: zodResolver(SummarySchema),
    defaultValues: defaultValues ||
      summaryDraft || {
        webinarId,
        summary: '',
      },
  })

  /* ================= DRAFT PERSIST ================= */
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
        summary: defaultValues.summary,
      })
    }
  }, [defaultValues, webinarId, form])

  /* ================= SUBMIT ================= */
  const onSubmit = async (data: z.infer<typeof SummarySchema>) => {
    if (loading) return

    try {
      setLoading(true)

      const isEdit = Boolean(defaultValues?._id)

      const endpoint = isEdit
        ? `/api/admin/summaries/${defaultValues!._id}`
        : `/api/admin/summaries/${webinarId}`

      const method = isEdit ? 'PUT' : 'POST'

      await apiRequest<
        z.infer<typeof SummarySchema>,
        any
      >({
        endpoint,
        method,
        body: data,
        showToast: true,
        successMessage: isEdit
          ? 'Summary updated successfully!'
          : 'Summary created successfully!',
      })

      onSave()
      clearDraft(DRAFT_KEY)

      form.reset({
        webinarId,
        summary: '',
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
          {/* Summary (Rich Text Editor) */}
<FormField
  control={form.control}
  name="summary"
  render={({ field }) => (
    <FormItem>
      {/* Label with icon */}
      <FormLabel className="flex items-center gap-2">
        <FaRobot className="text-gray-500" />
        AI Summary *
      </FormLabel>

      <FormControl>
        <RichTextEditor
          value={field.value || ''}
          onChange={field.onChange}
          placeholder="Write or paste the AI generated program summary here..."
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  )}
/>

          {/* <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel></FormLabel>
                <FormControl>
                  <div className="relative">
                    <FaRobot className="absolute left-3 top-3 text-gray-400" />
                    <Textarea
                      {...field}
                      placeholder="Write or generate the webinar summary here..."
                      className="pl-10 min-h-[150px]"
                      disabled={loading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
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
