'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  ConferenceFormSchema,
  ConferenceFormValues,
} from '@/validations/conferenceSchema'
import { FaCalendarAlt} from 'react-icons/fa'
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
  conferenceType,
  registrationType,
  timezones,
} from '@/lib/imports'
import { CustomDatePicker} from '@/lib/imports'
import { mutate } from 'swr'
import { fetchClient } from '@/lib/fetchClient'

// ================= IMAGE CONSTANTS =================
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ================= PROPS =================
interface AddConferenceFormProps {
  onSuccess: (newConference: any) => void
  conferenceToEdit?: any | null
}

// New Custom Date Helper
const toDate = (str: string) => {
  const [d, m, y] = str.split('/').map(Number)
  return new Date(y, m - 1, d)
}

export default function AddConferenceForm({
  onSuccess,
  conferenceToEdit,
}: AddConferenceFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-conference-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const conferenceDraft = drafts[DRAFT_KEY]

  // ================= IMAGE STATE =================
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    conferenceToEdit?.image || null
  )

  // ================= FORM =================
  const form = useForm<ConferenceFormValues>({
    resolver: zodResolver(ConferenceFormSchema),
    defaultValues:
      conferenceToEdit ||
      conferenceDraft || {
        name: '',
        image: '',
        description: '',
        conferenceType: '',
        timeZone: '',
        startDate: '',
        endDate: '',
        registrationType: 'free',
        amount: 0,
      },
  })

  // ================= DRAFT PERSIST =================
  useEffect(() => {
    if (conferenceToEdit?._id) return

    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values)
    })

    return () => subscription.unsubscribe()
  }, [form.watch, conferenceToEdit?._id])

  // ================= IMAGE SYNC (EDIT MODE) =================
  useEffect(() => {
    if (conferenceToEdit?.image) {
      form.setValue('image', conferenceToEdit.image, { shouldValidate: false })
      setImagePreview(conferenceToEdit.image)
    }
  }, [conferenceToEdit, form])

  // ================= IMAGE RESET =================
  const resetImage = () => {
    if (conferenceToEdit?.image) {
      form.setValue('image', conferenceToEdit.image, { shouldValidate: false })
      setImagePreview(conferenceToEdit.image)
    } else {
      form.setValue('image', '', { shouldValidate: false })
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
      resetImage()
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be ≤ 5 MB')
      resetImage()
      return
    }

    const img = new Image()
    img.onload = () => {
      if (img.width !== 300 || img.height !== 250) {
        toast.error('Image must be exactly 300 × 250 px')
        resetImage()
        return
      }

      const url = URL.createObjectURL(file)
      setImagePreview(url)
      form.setValue('image', files, { shouldValidate: true })
    }

    img.onerror = () => {
      toast.error('Invalid image file')
      resetImage()
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

  // ================= SUBMIT =================
  async function onSubmit(data: ConferenceFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        if (key === 'image' && value instanceof FileList) {
          formData.append('image', value[0])
          return
        }

        if (typeof value === 'number') {
          formData.append(key, String(value))
          return
        }

        formData.append(key, value)
      })

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/conferences`
      let method: 'POST' | 'PUT' = 'POST'

      if (conferenceToEdit?._id) {
        url += `/${conferenceToEdit._id}`
        method = 'PUT'
      }

      const res = await fetchClient(url, { method, body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success(
        conferenceToEdit
          ? 'Conference updated successfully!'
          : 'Conference created successfully!',
        { description: getIndianFormattedDate() }
      )

      form.reset()
      clearDraft(DRAFT_KEY)
      onSuccess(result.data)
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/conferences`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save conference')
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

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {conferenceToEdit ? 'Edit Conference' : 'Add Conference'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="conference-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-3"
          >
            {/* Conference NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conference Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaCalendarAlt />}
                      placeholder="type conference name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conference IMAGE */}
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Conference Image *</FormLabel>
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
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conference Type */}
            <FormField
              control={form.control}
              name="conferenceType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Conference Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select conference type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conferenceType.map((s) => (
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
    
              <CustomDatePicker name="endDate" label="End Date *" />

        

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
          form="conference-form"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? 'Saving Conference...'
            : conferenceToEdit
            ? 'Update Conference'
            : 'Create Conference'}
        </Button>
      </div>
    </div>
  )
}
