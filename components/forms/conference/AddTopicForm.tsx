'use client'

import React, { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import InputWithIcon from '@/components/InputWithIcon'
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
    defaultValues: {
      conferenceId,
      sessionId: '',
      topicType: 'Presentation',
      title: '',
      startTime: '',
      endTime: '',
      videoLink: '',
      speakerId: [],
      panelist: [],
      teamMember: [],
      moderator: '',
      quizMaster: '',
    },
  })

  /* ================= PREFILL (EDIT MODE FIX) ================= */

  useEffect(() => {
    if (!defaultValues?._id) return

    form.reset({
      conferenceId,
      sessionId: defaultValues.sessionId?._id || '',
      topicType: defaultValues.topicType,
      title: defaultValues.title,
      startTime: defaultValues.startTime,
      endTime: defaultValues.endTime,
      videoLink: defaultValues.videoLink || '',
      speakerId: defaultValues.speakerId?.map((s: any) => s._id) || [],
      moderator: defaultValues.moderator || '',
      quizMaster: defaultValues.quizMaster || '',
      panelist:
        defaultValues.panelist?.map((p: string) => ({ value: p })) || [],
      teamMember:
        defaultValues.teamMember?.map((t: string) => ({ value: t })) || [],
    })
  }, [defaultValues, conferenceId, form])

  /* ================= DRAFT (CREATE ONLY) ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = form.watch((values) => setDraft(DRAFT_KEY, values))
    return () => sub.unsubscribe()
  }, [defaultValues?._id])

  /* ================= FIELD ARRAYS ================= */

  const panelistArray = useFieldArray({
    control: form.control,
    name: 'panelist',
  })

  const teamArray = useFieldArray({
    control: form.control,
    name: 'teamMember',
  })

  const topicType = form.watch('topicType')

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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/speakers/active`, { headers }),
    ])
      .then(async ([s, sp]) => {
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
        panelist: data.panelist.map((p) => p.value),
        teamMember: data.teamMember.map((t) => t.value),
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

      // ✅ CLEAR FORM PROPERLY
      form.reset({
        conferenceId,
        sessionId: '',
        topicType: 'Presentation',
        title: '',
        startTime: '',
        endTime: '',
        videoLink: '',
        speakerId: [],
        panelist: [],
        teamMember: [],
        moderator: '',
        quizMaster: '',
      })

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
          {defaultValues ? 'Edit Topic' : 'Add Topic'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll pb-2">
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
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
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
                  <Select
                    key={field.value} // 🔥 FORCE REMOUNT
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="Select topic type" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'Presentation',
                        'Panel Discussion',
                        'Quiz',
                        'Debate',
                      ].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
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
                      placeholder="type session name"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Speaker (Presentation / Debate) */}
            {(topicType === 'Presentation' || topicType === 'Debate') && (
              <FormField
                control={form.control}
                name="speakerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speaker *</FormLabel>
                    <Popover open={speakerOpen} onOpenChange={setSpeakerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {topicType === 'Presentation' &&
                          field.value.length === 1
                            ? speakers.find((s) => s._id === field.value[0])
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
                                const selected = field.value.includes(s._id)
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
                                            ? field.value.filter(
                                                (id) => id !== s._id
                                              )
                                            : [...field.value, s._id]
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

                    {topicType === 'Debate' && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((id) => {
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
                                  field.onChange(
                                    field.value.filter((v) => v !== id)
                                  )
                                }
                              />
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* Moderator */}
            {topicType === 'Panel Discussion' && (
              <FormField
                control={form.control}
                name="moderator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moderator *</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        placeholder="type moderator name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Panelists */}
            {topicType === 'Panel Discussion' &&
              panelistArray.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`panelist.${i}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Panelist</FormLabel>
                        <FormControl>
                          <InputWithIcon
                            {...field}
                            placeholder="type penalist name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => panelistArray.remove(i)}
                  >
                    <X />
                  </Button>
                </div>
              ))}

            {topicType === 'Panel Discussion' && (
              <Button
                type="button"
                variant="outline"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => panelistArray.append({ value: '' })}
              >
                + Add Panelist
              </Button>
            )}

            {/* Quiz Master */}
            {topicType === 'Quiz' && (
              <FormField
                control={form.control}
                name="quizMaster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Master *</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        {...field}
                        placeholder="type quiz master name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Team Members */}
            {topicType === 'Quiz' &&
              teamArray.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`teamMember.${i}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Team Member</FormLabel>
                        <FormControl>
                          <InputWithIcon
                            {...field}
                            placeholder="type team meamber name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => teamArray.remove(i)}
                  >
                    <X />
                  </Button>
                </div>
              ))}

            {topicType === 'Quiz' && (
              <Button
                type="button"
                variant="outline"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => teamArray.append({ value: '' })}
              >
                + Add Team Member
              </Button>
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
                      placeholder="topic video link"
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
          form="topic-form"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading ? 'Saving ...' : defaultValues?._id ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  )
}
