'use client'

import React, { useEffect, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
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

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

import InputWithIcon from '@/components/InputWithIcon'
import { FaRegEdit } from 'react-icons/fa'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { SessionSchema, SessionValues } from '@/validations/sessionSchema'
import { apiRequest } from '@/lib/apiRequest'
import { fetcher } from '@/lib/fetcher'

type ConferenceDate = {
  date: string
  day: string
}

type Speaker = {
  _id: string
  speakerName: string
  prefix: string
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
  const [speakers, setSpeakers] = useState<Speaker[]>([]) // ⭐ NEW
  const [speakerOpen, setSpeakerOpen] = useState(false) // ⭐ NEW

  const form = useForm<SessionValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues: defaultValues || sessionDraft || {
      conferenceId,
      sessionName: '',
      chairperson: [], // ⭐ NEW
      sessionDate: '',
      hallId: '',
      trackId: '',
      startTime: '',
      endTime: '',
    },
  })

  /* ================= DRAFT ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = form.watch((v) => setDraft(DRAFT_KEY, v))
    return () => sub.unsubscribe()
  }, [form.watch, defaultValues?._id])

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues)
  }, [defaultValues, form])

/* ================= FETCH ================= */

useEffect(() => {
  if (!conferenceId) return

  async function fetchData() {
    try {
      const [datesRes, hallsRes, tracksRes, speakersRes] =
        await Promise.all([
          fetcher(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conferences/${conferenceId}/dates`
          ),
          fetcher(
            `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/halls/active`
          ),
          fetcher(
            `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/tracks/active`
          ),
          fetcher(
            `${process.env.NEXT_PUBLIC_API_URL}/api/speakers/active`
          ),
        ])

      setDates(datesRes?.dates ?? [])
      setHalls(hallsRes?.data ?? [])
      setTracks(tracksRes?.data ?? [])
      setSpeakers(speakersRes?.data ?? [])
    } catch (err) {
      console.error('Failed to fetch session form data', err)
    }
  }

  fetchData()
}, [conferenceId])


/* ================= SUBMIT ================= */

const onSubmit = async (values: SessionValues) => {
  if (loading) return // ✅ double-click guard

  try {
    setLoading(true)

    const isEdit = Boolean(defaultValues?._id)

    const result = await apiRequest<
      SessionValues,
      { data: SessionValues & { _id: string } }
    >({
      endpoint: isEdit
        ? `/api/admin/sessions/${defaultValues!._id}`
        : `/api/admin/conferences/${conferenceId}/sessions`,
      method: isEdit ? 'PUT' : 'POST',
      body: values,
      showToast: false,
    })

    toast.success(
      isEdit
        ? 'Session updated successfully!'
        : 'Session created successfully!',
      { description: getIndianFormattedDate() }
    )

    onSave?.(result.data) // ✅ backend source of truth
    form.reset()
    clearDraft(DRAFT_KEY)
  } catch (err: any) {
    toast.error(err.message || 'Something went wrong')
  } finally {
    setLoading(false)
  }
}


  /* ================= UI ================= */

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
                    <InputWithIcon {...field} icon={<FaRegEdit />}
                    placeholder='type session name...' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ⭐ Chairperson (Multi Select Speakers) */}
            <FormField
              control={form.control}
              name="chairperson"
              render={({ field }) => {
                const value = field.value ?? []

                return (
                  <FormItem>
                    <FormLabel>Chairpersons *</FormLabel>

                    <Popover open={speakerOpen} onOpenChange={setSpeakerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          Select chairperson
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0 max-h-[300px] overflow-hidden">
                        <Command>
                          <CommandInput placeholder="Search speaker..." />
                          <CommandEmpty>No speaker found</CommandEmpty>
                          <CommandGroup className="max-h-[240px] overflow-y-auto">
                            {speakers.map((s) => {
                              const selected = value.includes(s._id)
                              return (
                                <CommandItem
                                  key={s._id}
                                  onSelect={() =>
                                    field.onChange(
                                      selected
                                        ? value.filter((id) => id !== s._id)
                                        : [...value, s._id]
                                    )
                                  }
                                  
                                >
                                  {s.prefix} {s.speakerName}
                                  {selected && (
                                    <Check className="ml-auto h-4 w-4" />
                                    
                                  )}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected speakers */}
                    {value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {value.map((id) => {
                          const sp = speakers.find((s) => s._id === id)
                          return (
                            <span
                              key={id}
                              className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-lg"
                            >
                              {sp?.speakerName}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() =>
                                  field.onChange(value.filter((v) => v !== id))
                                }
                              />
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </FormItem>
                )
              }}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="sessionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Date *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full p-3'>
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
                    <SelectTrigger className='w-full p-3'>
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
                    <SelectTrigger className='w-full p-3'>
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
                </FormItem>
              )}
            />

            <CustomTimePicker name="startTime" label="Start Time *" />
            <CustomTimePicker name="endTime" label="End Time *" />
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
