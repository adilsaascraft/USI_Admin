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
import { apiRequest } from '@/lib/apiRequest'
import { fetcher } from '@/lib/fetcher'

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
  const [moderatorOpen, setModeratorOpen] = useState(false)
  const [panelistOpen, setPanelistOpen] = useState(false)
  const [quizMasterOpen, setQuizMasterOpen] = useState(false)
  const [teamMemberOpen, setTeamMemberOpen] = useState(false)

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
      form.setValue('moderator', '')
      form.setValue('panelist', [])
      form.setValue('quizMaster', '')
      form.setValue('teamMember', [])
    }

    if (topicType === 'Panel Discussion') {
      form.setValue('speakerId', [])
      form.setValue('quizMaster', '')
      form.setValue('teamMember', [])
    }

    if (topicType === 'Quiz') {
      form.setValue('speakerId', [])
      form.setValue('moderator', '')
      form.setValue('panelist', [])
    }
  }, [topicType, form])

  useEffect(() => {
    if (topicType === 'Debate') {
      const team = form.getValues('teamMember') || []
      form.setValue('speakerId', team, { shouldValidate: true })
    }
  }, [topicType, form.watch('teamMember')])


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
      moderator: defaultValues.moderator?._id || '',
      panelist: defaultValues.panelist?.map((p: any) => p._id) || [],
      quizMaster: defaultValues.quizMaster?._id || '',
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
  if (!conferenceId) return

  async function fetchData() {
    try {
      const [sessionsRes, speakersRes] = await Promise.all([
        fetcher(
          `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/sessions`
        ),
        fetcher(
          `${process.env.NEXT_PUBLIC_API_URL}/api/speakers/active`
        ),
      ])

      setSessions(sessionsRes?.data ?? [])
      setSpeakers(speakersRes?.data ?? [])
    } catch (err) {
      console.error('Failed to fetch sessions or speakers', err)
    }
  }

  fetchData()
}, [conferenceId])

  /* ================= RENDER SPEAKER POPOVER ================= */

  const renderSpeakerPopover = (
    field: any,
    open: boolean,
    setOpen: (open: boolean) => void,
    label: string,
    placeholder: string,
    isMulti = false,
    selectedValues: string[] = []
  ) => {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            type="button"
          >
            {isMulti
              ? selectedValues.length > 0
                ? `${selectedValues.length} selected`
                : placeholder
              : field.value
                ? speakers.find((s) => s._id === field.value)?.speakerName
                : placeholder}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandGroup>
                {speakers.map((speaker) => {
                  const isSelected = isMulti
                    ? selectedValues.includes(speaker._id)
                    : field.value === speaker._id
                  return (
                    <CommandItem
                      key={speaker._id}
                      onSelect={() => {
                        if (isMulti) {
                          const newValues = isSelected
                            ? selectedValues.filter((id) => id !== speaker._id)
                            : [...selectedValues, speaker._id]
                          field.onChange(newValues)
                        } else {
                          field.onChange(speaker._id)
                          setOpen(false)
                        }
                      }}
                    >
                      {speaker.prefix} {speaker.speakerName}
                      {isSelected && (
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
    )
  }

  /* ================= RENDER SELECTED CHIPS ================= */

  const renderSelectedChips = (field: any, fieldName: string, isMulti: boolean) => {
    if (!isMulti || !Array.isArray(field.value) || field.value.length === 0) {
      return null
    }

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {field.value.map((id: string) => {
          const speaker = speakers.find((s) => s._id === id)
          if (!speaker) return null
          return (
            <div
              key={id}
              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              {speaker.prefix} {speaker.speakerName}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-600"
                onClick={() => {
                  const newValues = field.value.filter((v: string) => v !== id)
                  field.onChange(newValues)
                }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  /* ================= SUBMIT ================= */

const onSubmit = async (values: TopicFormValues) => {
  if (loading) return // ✅ double-click guard

  try {
    setLoading(true)

    const isEdit = Boolean(defaultValues?._id)

    // -------------------------------
    // Normalize payload (business logic)
    // -------------------------------
    const payload: TopicFormValues = {
      ...values,
      speakerId:
        values.topicType === 'Debate'
          ? values.teamMember
          : values.speakerId,
      moderator: values.moderator || undefined,
      quizMaster: values.quizMaster || undefined,
    }

    const result = await apiRequest<
      TopicFormValues,
      { data: TopicFormValues & { _id: string } }
    >({
      endpoint: isEdit
        ? `/api/admin/topics/${defaultValues!._id}`
        : `/api/admin/conferences/${conferenceId}/topics`,
      method: isEdit ? 'PUT' : 'POST',
      body: payload,
      showToast: false,
    })

    toast.success('Topic saved successfully!', {
      description: getIndianFormattedDate(),
    })

    onSave?.(result.data) // ✅ backend source of truth

    form.reset({
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
                    <SelectTrigger className='w-full p-3'>
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

            {/* Speaker (Presentation) */}
            {topicType === 'Presentation' && (
              <FormField
                control={form.control}
                name="speakerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speaker *</FormLabel>
                    {renderSpeakerPopover(
                      field,
                      speakerOpen,
                      setSpeakerOpen,
                      'speaker',
                      'Select speaker',
                      true,
                      field.value || []
                    )}
                    {renderSelectedChips(field, 'speakerId', true)}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Debate Team Members */}
            {topicType === 'Debate' && (
              <FormField
                control={form.control}
                name="teamMember"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debate Team Members *</FormLabel>
                    {renderSpeakerPopover(
                      field,
                      teamMemberOpen,
                      setTeamMemberOpen,
                      'team members',
                      'Select team members',
                      true,
                      field.value || []
                    )}
                    {renderSelectedChips(field, 'teamMember', true)}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Panel Discussion Fields */}
            {topicType === 'Panel Discussion' && (
              <>
                <FormField
                  control={form.control}
                  name="moderator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moderator *</FormLabel>
                      {renderSpeakerPopover(
                        field,
                        moderatorOpen,
                        setModeratorOpen,
                        'moderator',
                        'Select moderator',
                        false
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panelist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panelists</FormLabel>
                      {renderSpeakerPopover(
                        field,
                        panelistOpen,
                        setPanelistOpen,
                        'panelists',
                        'Select panelists',
                        true,
                        field.value || []
                      )}
                      {renderSelectedChips(field, 'panelist', true)}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Quiz Fields */}
            {topicType === 'Quiz' && (
              <>
                <FormField
                  control={form.control}
                  name="quizMaster"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Master *</FormLabel>
                      {renderSpeakerPopover(
                        field,
                        quizMasterOpen,
                        setQuizMasterOpen,
                        'quiz master',
                        'Select quiz master',
                        false
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamMember"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Members</FormLabel>
                      {renderSpeakerPopover(
                        field,
                        teamMemberOpen,
                        setTeamMemberOpen,
                        'team members',
                        'Select team members',
                        true,
                        field.value || []
                      )}
                      {renderSelectedChips(field, 'teamMember', true)}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
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
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {loading ? 'Saving...' : defaultValues?._id ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  )
}