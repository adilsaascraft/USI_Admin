'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { CourseFormSchema, CourseFormValues } from '@/validations/courseSchema'
import { FaCalendarAlt, FaCalendarDay } from 'react-icons/fa'
import InputWithIcon from '@/components/InputWithIcon'
import RichTextEditor from '@/components/RichTextEditor'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import {
  useForm,
  zodResolver,
  toast,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  Button,
  SheetClose,
  status,
} from '@/lib/imports'
import { CustomDatePicker, CustomTimePicker } from '@/lib/imports'
import { registrationType, timezones } from '@/lib/imports'
import { mutate } from 'swr'
import { fetchClient } from '@/lib/fetchClient'

/* ================= IMAGE CONSTANTS ================= */
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/* ================= PROPS ================= */
interface CourseFormProps {
  onSuccess: (course: any) => void
  courseId?: string | null
}

/* ================= DATE HELPER ================= */
const toDate = (str: string) => {
  const [d, m, y] = str.split('/').map(Number)
  return new Date(y, m - 1, d)
}

export default function AddCourseForm({
  onSuccess,
  courseId,
}: CourseFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-course-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const draft = drafts[DRAFT_KEY]

  /* ================= IMAGE ================= */
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  /* ================= FORM ================= */
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(CourseFormSchema),
    defaultValues: draft || {
      courseName: '',
      courseImage: '',
      description: '',
      timeZone: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      registrationType: 'free',
      amount: 0,
      streamLink: '',
      status: 'Active',
    },
  })

  /* ================= LOAD COURSE (EDIT) ================= */
  useEffect(() => {
    if (!courseId) return
    ;(async () => {
      try {
        const res = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${courseId}`
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.message)

        const data = json.data
        form.reset({
          ...data,
          courseImage: data.courseImage,
        })
        setImagePreview(data.courseImage)
      } catch (err: any) {
        toast.error(err.message || 'Failed to load course')
      }
    })()
  }, [courseId])

  /* ================= DRAFT ================= */
  useEffect(() => {
    if (courseId) return
    const sub = form.watch((values) => setDraft(DRAFT_KEY, values))
    return () => sub.unsubscribe()
  }, [form.watch, courseId])

  /* ================= IMAGE HANDLERS ================= */
  const resetImage = () => {
    form.setValue('courseImage', '', { shouldValidate: false })
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageChange = (files?: FileList) => {
    if (!files?.[0]) return
    const file = files[0]

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid image type')
      resetImage()
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Max image size is 5MB')
      resetImage()
      return
    }

    const img = new Image()
    img.onload = () => {
      const url = URL.createObjectURL(file)
      setImagePreview(url)
      form.setValue('courseImage', files, { shouldValidate: true })
    }
    img.src = URL.createObjectURL(file)
  }

  /* ================= DATE FIX ================= */
  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')

  useEffect(() => {
    if (!startDate || !endDate) return
    if (toDate(endDate) <= toDate(startDate)) {
      const d = toDate(startDate)
      d.setDate(d.getDate() + 1)
      form.setValue(
        'endDate',
        `${String(d.getDate()).padStart(2, '0')}/${String(
          d.getMonth() + 1
        ).padStart(2, '0')}/${d.getFullYear()}`
      )
    }
  }, [startDate])

  /* ================= SUBMIT ================= */
  async function onSubmit(values: CourseFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(values).forEach(([key, value]) => {
        if (value == null) return
        if (key === 'courseImage' && value instanceof FileList) {
          formData.append('courseImage', value[0])
        } else {
          formData.append(key, String(value))
        }
      })

      const method = courseId ? 'PUT' : 'POST'
      const url = courseId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${courseId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`

      const res = await fetchClient(url, { method, body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(courseId ? 'Course updated' : 'Course created', {
        description: getIndianFormattedDate(),
      })

      clearDraft(DRAFT_KEY)
      onSuccess(json.data)
      mutate(url)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = form.watch('registrationType') === 'paid'

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {courseId ? 'Edit Course' : 'Add Course'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="course-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-3"
          >
            {/* Course Name */}
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} icon={<FaCalendarAlt />} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image */}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleImageChange(e.target.files || undefined)}
            />
            {imagePreview && (
              <img src={imagePreview} className="w-72 rounded" />
            )}

            {/* Timezone */}
            <Select
              value={form.watch('timeZone')}
              onValueChange={(v) => form.setValue('timeZone', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((g) => (
                  <SelectGroup key={g.label}>
                    <SelectLabel>{g.label}</SelectLabel>
                    {g.items.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            {/* Dates & Time */}
            <CustomDatePicker name="startDate" label="Start Date *" />
            <CustomTimePicker name="startTime" label="Start Time *" />
            <CustomDatePicker name="endDate" label="End Date *" />
            <CustomTimePicker name="endTime" label="End Time *" />

            {/* Registration */}
            <Select
              value={form.watch('registrationType')}
              onValueChange={(v) => form.setValue('registrationType', v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Registration Type" />
              </SelectTrigger>
              <SelectContent>
                {registrationType.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              disabled={!isPaid}
              {...form.register('amount', { valueAsNumber: true })}
            />

            {/* Stream */}
            <InputWithIcon
              {...form.register('streamLink')}
              icon={<FaCalendarDay />}
            />

            {/* Description */}
            <RichTextEditor
              value={form.watch('description') || ''}
              onChange={(v) => form.setValue('description', v)}
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
          form="course-form"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? 'Saving Course...'
            : courseId
            ? 'Update Course'
            : 'Create Course'}
        </Button>
      </div>
    </div>
  )
}
