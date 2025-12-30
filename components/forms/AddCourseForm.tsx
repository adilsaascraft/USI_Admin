'use client'

import { useEffect, useRef, useState } from 'react'
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
  onSuccess: (newCourse: any) => void
  courseToEdit?: any | null
}

// New Custom Date Helper
const toDate = (str: string) => {
  const [d, m, y] = str.split('/').map(Number)
  return new Date(y, m - 1, d)
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

      const { watch, setValue } = form
      const startDate = watch('startDate')
      const endDate = watch('endDate')

      // ================= AUTO FIX END DATE =================
        useEffect(() => {
          if (!startDate || !endDate) return
      
          const s = toDate(startDate)
          const e = toDate(endDate)
      
          if (e <= s) {
            const newEnd = new Date(s)
            newEnd.setDate(newEnd.getDate() + 1)
      
            const formatted = `${String(newEnd.getDate()).padStart(2, '0')}/${String(
              newEnd.getMonth() + 1
            ).padStart(2, '0')}/${newEnd.getFullYear()}`
      
            setValue('endDate', formatted)
          }
        }, [startDate])

  /* ================= SUBMIT ================= */
  async function onSubmit(data: CourseFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        if (key === 'courseImage' && value instanceof FileList) {
          formData.append('courseImage', value[0])
          return
        }

        if (typeof value === 'number') {
          formData.append(key, String(value))
          return
        }

        formData.append(key, value)
      })

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`
      let method: 'POST' | 'PUT' = 'POST'

      if (courseToEdit?._id) {
        url += `/${courseToEdit._id}`
        method = 'PUT'
      }

      const res = await fetchClient(url, { method, body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success(
        courseToEdit
          ? 'Course updated successfully'
          : 'Course created successfully',
        { description: getIndianFormattedDate() }
      )

      form.reset()
      clearDraft(DRAFT_KEY)
      onSuccess(result.data)
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

const registrationTypeValue = watch('registrationType')
  const isPaidEvent = registrationTypeValue === 'paid'

  useEffect(() => {
    if (registrationTypeValue === 'free') {
      form.setValue('amount', 0, { shouldValidate: true })
    }
  }, [registrationTypeValue])

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
                    <InputWithIcon {...field} icon={<FaCalendarAlt />}
                    placeholder='type course name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseImage"
              render={() => (
                <FormItem>
                  <FormLabel>Course Thumbnail *</FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleImageChange(e.target.files || undefined)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPG / JPEG / PNG / WEBP · Max 5MB · 300 × 250 px
                  </p>

                  {imagePreview && (
                    <div className="mt-3 w-[300px] h-[250px] border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Event Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Start Date + Time */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {/* Start Date */}
              <CustomDatePicker name="startDate" label="Start Date *" />

              {/* Start Time */}
              <div className="w-full sm:w-1/2">
                <CustomTimePicker name="startTime" label="Time *" />
              </div>
            </div>

            {/* End Date + Time */}
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              {/* End Date */}
              <CustomDatePicker name="endDate" label="End Date *" />

              {/* End Time */}
              <div className="w-full sm:w-1/2 mt-4 sm:mt-0">
                <CustomTimePicker name="endTime" label="Time *" />
              </div>
            </div>

            {/* Registration Type + Amount */}
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              {/* Registration Type */}
              <FormField
                control={form.control}
                name="registrationType"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-1/2">
                    <FormLabel>Registration Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full p-3">
                          <SelectValue placeholder="Select registration type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {registrationType.map((reg) => (
                          <SelectItem key={reg.value} value={reg.value}>
                            {reg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-1/2">
                    <FormLabel>
                      Amount{' '}
                      {isPaidEvent && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        disabled={!isPaidEvent}
                        min={0}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={
                          !isPaidEvent ? 'bg-muted cursor-not-allowed' : ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="streamLink"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Webinar Streaming Link *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="eg. https://youtube.com/webinar"
                      icon={<FaCalendarDay />}
                    />
                  </FormControl>
                  <FormMessage />
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

            {/* Description (Rich Text Editor) */}
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
                      placeholder="Write something..."
                    />
                  </FormControl>
                  <FormMessage />
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
