'use client'

import React, { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFormDraftStore } from '@/stores/useFormDraftStore'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import InputWithIcon from '@/components/InputWithIcon'
import RichTextEditor from '@/components/RichTextEditor'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { FaTextHeight, FaVideo } from 'react-icons/fa'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { TopicSchema, TopicFormValues } from '@/validations/topicSchema'

/* ================= PROPS ================= */

type AddTopicFormProps = {
  conferenceId: string
  defaultValues?: any
  onSave: (data: any) => void
}

/* ================= COMPONENT ================= */

export default function AddTopicForm({
  conferenceId,
  defaultValues,
  onSave,
}: AddTopicFormProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [sessionOpen, setSessionOpen] = useState(false)
  const [speakerOpen, setSpeakerOpen] = useState(false)

  const DRAFT_KEY = 'add-topic-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const topicDraft = drafts[DRAFT_KEY]

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(TopicSchema),
    defaultValues: defaultValues || topicDraft || {
      conferenceId,
      sessionId: '',
      topicType: 'Presentation',
      title: '',
      startTime: '',
      endTime: '',
      videoLink: '',
      description: '',
      speakerId: [],
      panelist: [],
      teamMember: [],
      moderator: '',
      quizMaster: '',
    },
  })

  const topicType = form.watch('topicType')

  /* ================= RESET DEPENDENT FIELDS ================= */

  useEffect(() => {
    if (topicType === 'Presentation' || topicType === 'Debate') {
      form.setValue('moderator', undefined)
      form.setValue('panelist', [])
      form.setValue('quizMaster', undefined)
      form.setValue('teamMember', [])
    }

    if (topicType === 'Panel Discussion') {
      form.setValue('speakerId', [])
      form.setValue('quizMaster', undefined)
      form.setValue('teamMember', [])
    }

    if (topicType === 'Quiz') {
      form.setValue('speakerId', [])
      form.setValue('moderator', undefined)
      form.setValue('panelist', [])
    }
  }, [topicType, form])

  /* ================= PREFILL EDIT MODE ================= */

  useEffect(() => {
    if (!defaultValues?._id) return

    form.reset({
      conferenceId,
      sessionId: defaultValues.sessionId?._id || '',
      topicType: defaultValues.topicType,
      title: defaultValues.title,
      startTime: defaultValues.startTime,
      endTime: defaultValues.endTime,
      videoLink: defaultValues.videoLink,
      description: defaultValues.description || '',
      speakerId: defaultValues.speakerId?.map((s: any) => s._id) || [],
      moderator: defaultValues.moderator?._id,
      panelist: defaultValues.panelist?.map((p: any) => p._id) || [],
      quizMaster: defaultValues.quizMaster?._id,
      teamMember: defaultValues.teamMember?.map((t: any) => t._id) || [],
    })
  }, [defaultValues, conferenceId, form])

  /* ================= DRAFT (CREATE ONLY) ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = form.watch((v) => setDraft(DRAFT_KEY, v))
    return () => sub.unsubscribe()
  }, [defaultValues?._id])

  /* ================= FETCH ================= */

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/sessions`,
        { headers }
      ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/speakers/active`, {
        headers,
      }),
    ]).then(async ([s, sp]) => {
      setSessions((await s.json()).data || [])
      setSpeakers((await sp.json()).data || [])
    })
  }, [conferenceId])

  /* ================= SUBMIT ================= */

  async function onSubmit(data: TopicFormValues) {
    try {
      setLoading(true)

      const payload = {
        ...data,
        panelist: data.panelist,
        teamMember: data.teamMember,
      }

      const token = localStorage.getItem('token')
      const isEdit = !!defaultValues?._id

      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/topics/${defaultValues._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conferences/${conferenceId}/topics`

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success('Topic saved successfully!', {
        description: getIndianFormattedDate(),
      })

      onSave(result.data)
      clearDraft(DRAFT_KEY)
      form.reset()
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
          {defaultValues ? 'Edit Topic' : 'Add Topic'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="topic-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            {/* Session */}
            <FormField
              control={form.control}
              name="sessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session *</FormLabel>
                  <Popover open={sessionOpen} onOpenChange={setSessionOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {field.value
                          ? sessions.find((s) => s._id === field.value)
                              ?.sessionName
                          : 'Select session'}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-full">
                      <Command>
                        <CommandInput placeholder="Search session..." />
                        <CommandList>
                          <CommandGroup>
                            {sessions.map((s) => (
                              <CommandItem
                                key={s._id}
                                onSelect={() => {
                                  field.onChange(s._id)
                                  setSessionOpen(false)
                                }}
                              >
                                {s.sessionName}
                                {s._id === field.value && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic Type */}
            <FormField
              control={form.control}
              name="topicType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Presentation', 'Panel Discussion', 'Quiz', 'Debate'].map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaTextHeight />}
                      placeholder="Topic title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Speaker (Presentation / Debate) */}
            {(topicType === 'Presentation' || topicType === 'Debate') && (
              <FormField
                control={form.control}
                name="speakerId"
                render={({ field }) => {
                  const value = Array.isArray(field.value) ? field.value : []

                  return (
                    <FormItem>
                      <FormLabel>Speaker *</FormLabel>
                      <Popover open={speakerOpen} onOpenChange={setSpeakerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {topicType === 'Presentation' && value.length === 1
                              ? speakers.find((s) => s._id === value[0])
                                  ?.speakerName
                              : 'Select speaker'}
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0 w-full">
                          <Command>
                            <CommandInput placeholder="Search speaker..." />
                            <CommandList>
                              <CommandGroup>
                                {speakers.map((s) => {
                                  const selected = value.includes(s._id)
                                  return (
                                    <CommandItem
                                      key={s._id}
                                      onSelect={() => {
                                        if (topicType === 'Presentation') {
                                          field.onChange([s._id])
                                          setSpeakerOpen(false)
                                        } else {
                                          field.onChange(
                                            selected
                                              ? value.filter((id) => id !== s._id)
                                              : [...value, s._id]
                                          )
                                        }
                                      }}
                                    >
                                      {s.prefix} {s.speakerName}
                                      {selected && (
                                        <Check className="ml-auto h-4 w-4" />
                                      )}
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {topicType === 'Debate' && value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {value.map((id) => {
                            const sp = speakers.find((s) => s._id === id)
                            return (
                              <span
                                key={id}
                                className="flex items-center gap-1 bg-blue-200 px-2 py-1 rounded-xl"
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

                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            )}

            {/* Time + Video */}
            <CustomTimePicker name="startTime" label="Start Time *" />
            <CustomTimePicker name="endTime" label="End Time *" />

            <FormField
              control={form.control}
              name="videoLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Link *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaVideo />}
                      placeholder="Video URL"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Topic</FormLabel>
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

      {/* FOOTER */}
      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between bg-background">
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
        <Button
          type="submit"
          form="topic-form"
          disabled={loading}
          className="bg-orange-600 text-white"
        >
          {loading ? 'Saving...' : defaultValues?._id ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  )
}
