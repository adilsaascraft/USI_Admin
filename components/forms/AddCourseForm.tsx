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
  Button,
  SheetClose,
  status,
  SelectGroup,
  SelectLabel,
  registrationType,
  timezones
} from '@/lib/imports'
import { CustomDatePicker, CustomTimePicker } from '@/lib/imports'
import { mutate } from 'swr'
import { fetchClient } from '@/lib/fetchClient'

/* ================= IMAGE CONFIG ================= */
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ================= PROPS ================= */
interface AddCourseFormProps {
  onSuccess: (course: any) => void
  courseToEdit?: any | null
}

export default function AddCourseForm({
  onSuccess,
  courseToEdit,
}: AddCourseFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-course-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const courseDraft = drafts[DRAFT_KEY]

  /* ================= IMAGE STATE ================= */
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    courseToEdit?.courseImage || null
  )

  /* ================= FORM ================= */
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(CourseFormSchema),
    defaultValues: courseToEdit ||
      courseDraft || {
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

    // ================= DRAFT PERSIST =================
    useEffect(() => {
      if (courseToEdit?._id) return

      const subscription = form.watch((values) => {
        setDraft(DRAFT_KEY, values)
      })

      return () => subscription.unsubscribe()
    }, [form.watch, courseToEdit?._id])

  
  // ================= IMAGE SYNC (EDIT MODE) =================
    useEffect(() => {
      if (courseToEdit?.courseImage) {
        form.setValue('courseImage', courseToEdit.courseImage, { shouldValidate: false })
        setImagePreview(courseToEdit.courseImage)
      }
    }, [courseToEdit, form])
  
    // ================= IMAGE RESET =================
    const resetCourseImage = () => {
      if (courseToEdit?.courseImage) {
        form.setValue('courseImage', courseToEdit.image, { shouldValidate: false })
        setImagePreview(courseToEdit.courseImage)
      } else {
        form.setValue('courseImage', '', { shouldValidate: false })
        setImagePreview(null)
      }
  
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  
  // ================= IMAGE CHANGE =================
    const handleImageChange = (files?: FileList) => {
      if (!files || !files[0]) return
  
      const file = files[0]
  
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Only JPG, JPEG, PNG, WEBP images are allowed')
        resetCourseImage()
        return
      }
  
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Image size must be ≤ 5 MB')
        resetCourseImage()
        return
      }
  
      const img = new Image()
      img.onload = () => {
        if (img.width !== 300 || img.height !== 250) {
          toast.error('Image must be exactly 300 × 250 px')
          resetCourseImage()
          return
        }
  
        const url = URL.createObjectURL(file)
        setImagePreview(url)
        form.setValue('courseImage', files, { shouldValidate: true })
      }
  
      img.onerror = () => {
        toast.error('Invalid image file')
        resetCourseImage()
      }
  
      img.src = URL.createObjectURL(file)
    }

  /* ================= SUBMIT ================= */
  async function onSubmit(values: CourseFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(values).forEach(([key, value]) => {
        if (value == null) return

        if (key === 'courseImage' && value instanceof FileList) {
          formData.append('courseImage', value[0])
          return
        }

        formData.append(key, String(value))
      })

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`
      let method: 'POST' | 'PUT' = 'POST'

      if (courseToEdit?._id) {
        url += `/${courseToEdit._id}`
        method = 'PUT'
      }

      const res = await fetchClient(url, { method, body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(
        courseToEdit
          ? 'Course updated successfully'
          : 'Course created successfully',
        { description: getIndianFormattedDate() }
      )

      form.reset()
      clearDraft(DRAFT_KEY)
      onSuccess(json.data)
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = form.watch('registrationType') === 'paid'

  useEffect(() => {
    if (!isPaid) form.setValue('amount', 0)
  }, [isPaid])

  /* ================= UI ================= */
  return (
    <div className="flex flex-col min-h-full">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {courseToEdit ? 'Edit Course' : 'Add Course'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="course-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
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

            <Input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageChange(e.target.files || undefined)}
            />

            {imagePreview && (
              <img src={imagePreview} className="w-[300px] h-[250px]" />
            )}

            {/* Time Zone Dropdown */}
            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem className="w-full min-w-0">
                  <FormLabel>Time Zone *</FormLabel>

                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full p-3 overflow-hidden">
                      <SelectValue
                        placeholder="Select timezone"
                        className="block w-full truncate"
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {timezones.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel className="truncate">
                            {group.label}
                          </SelectLabel>
                          {group.items.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              <span
                                className="block max-w-[260px] truncate"
                                title={tz.label}
                              >
                                {tz.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <CustomDatePicker name="startDate" label="Start Date *" />
            <CustomTimePicker name="startTime" label="Time *" />
            <CustomDatePicker name="endDate" label="End Date *" />
            <CustomTimePicker name="endTime" label="Time *" />

            <FormField
              control={form.control}
              name="registrationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className='w-full p-3'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {registrationType.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount {isPaid && '*'}</FormLabel>
                  <Input
                    type="number"
                    disabled={!isPaid}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="streamLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Link *</FormLabel>
                  <InputWithIcon {...field} icon={<FaCalendarDay />} />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                />
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
          form="course-form"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? 'Saving Course...'
            : courseToEdit
            ? 'Update Course'
            : 'Create Course'}
        </Button>
      </div>
    </div>
  )
}
