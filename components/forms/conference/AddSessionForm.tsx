'use client'

import React, { useEffect, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import RichTextEditor from '@/components/RichTextEditor'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetClose,
  toast,
  CustomTimePicker,
} from '@/lib/imports'
import InputWithIcon from '@/components/InputWithIcon'
import { FaRegEdit } from 'react-icons/fa'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { SessionSchema, SessionValues } from '@/validations/sessionSchema'

type ConferenceDate = {
  date: string
  day: string
}

type AddSessionFormProps = {
  conferenceId: string
  defaultValues?: Partial<SessionValues> & { _id?: string }
  onSave: (data: SessionValues & { _id: string }) => void
}

export default function AddSessionForm({
  conferenceId,
  defaultValues,
  onSave,
}: AddSessionFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-session-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const sessionDraft = drafts[DRAFT_KEY]
  const [dates, setDates] = useState<ConferenceDate[]>([])
  const [halls, setHalls] = useState<any[]>([])
  const [tracks, setTracks] = useState<any[]>([])

  const form = useForm<SessionValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues: defaultValues || sessionDraft || {
      conferenceId,
      sessionName: '',
      sessionDate: '',
      hallId: '',
      trackId: '',
        startTime: '',
        endTime: '',
        description: '',
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

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues)
  }, [defaultValues, form])

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('token')
      if (!token) return

      const headers = { Authorization: `Bearer ${token}` }

      const [d, h, t] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conferences/${conferenceId}/dates`,
          { headers }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/halls/active`,
          { headers }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/tracks/active`,
          { headers }
        ),
      ])

      setDates((await d.json()).dates || [])
      setHalls((await h.json()).data || [])
      setTracks((await t.json()).data || [])
    }

    fetchData()
  }, [conferenceId])

  async function onSubmit(data: SessionValues) {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Unauthorized')

      const isEdit = !!defaultValues?._id
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/${
            defaultValues!._id
          }`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conferences/${conferenceId}/sessions`

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success(
        isEdit
          ? 'Session updated successfully!'
          : 'Session created successfully!',
        { description: getIndianFormattedDate() }
      )

      onSave(result.data)
      form.reset()
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {defaultValues ? 'Edit Session' : 'Add Session'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="session-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            {/* Session Name */}
            <FormField
              control={form.control}
              name="sessionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaRegEdit />}
                      placeholder="type session name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="sessionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Date *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {dates.map((d) => (
                        <SelectItem key={d.date} value={d.date}>
                          {d.date} {d.day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hall */}
            <FormField
              control={form.control}
              name="hallId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hall *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="Select hall" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h._id} value={h._id}>
                          {h.hallName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Track */}
            <FormField
              control={form.control}
              name="trackId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Track *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="Select track" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.trackName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CustomTimePicker name="startTime" label="Start Time *" />
            <CustomTimePicker name="endTime" label="End Time *" />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* ---- Footer ---- */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between bg-background">
        <SheetClose asChild>
          <Button
            type="button"
            variant="outline"
            className="border border-gray-400"
          >
            Close
          </Button>
        </SheetClose>
        <Button
          type="submit"
          form="session-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading ? 'Saving ...' : defaultValues?._id ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  )
}
