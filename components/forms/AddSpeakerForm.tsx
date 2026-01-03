'use client'

import { useEffect, useState } from 'react'
import {
  SpeakerFormSchema,
  SpeakerFormValues,
} from '@/validations/speakerSchema'
import {
  FaUser,
  FaGraduationCap,
  FaGlobe,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import InputWithIcon from '@/components/InputWithIcon'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  zodResolver,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from '@/lib/imports'

import { Button, SheetClose, toast, status, prefix } from '@/lib/imports'
import { fetchClient } from '@/lib/fetchClient'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= PROPS ================= */

type AddSpeakerFormProps = {
  defaultValues?: SpeakerFormValues & { _id?: string }
  onSave: (data: any) => Promise<void>
}

/* ================= COMPONENT ================= */

export default function AddSpeakerForm({
  defaultValues,
  onSave,
}: AddSpeakerFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-speaker-form'
    const { drafts, setDraft, clearDraft } = useFormDraftStore()
    const courseDraft = drafts[DRAFT_KEY]
  const [preview, setPreview] = useState<string | null>(
    (defaultValues?.speakerProfilePicture as string) || null
  )

  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(SpeakerFormSchema),
    defaultValues: 
      courseDraft || {
        prefix: defaultValues?.prefix || '',
        speakerName: defaultValues?.speakerName || '',
        specialization: defaultValues?.specialization || '',
        affiliation: defaultValues?.affiliation || '',
        country: defaultValues?.country || '',
        state: '',
        city: '',
        status: defaultValues?.status || 'Active',
        speakerProfilePicture: defaultValues?.speakerProfilePicture,
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

  /* ================= IMAGE HANDLER ================= */

  const handleImageChange = (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    form.setValue('speakerProfilePicture', file)
  }

  /* ================= SUBMIT ================= */

  const onSubmit = async (data: SpeakerFormValues) => {
    try {
      setLoading(true)

      const formData = new FormData()

      // Append text fields
      formData.append('prefix', data.prefix)
      formData.append('speakerName', data.speakerName)
      formData.append('specialization', data.specialization || '')
      formData.append('affiliation', data.affiliation)
      formData.append('country', data.country)
      formData.append('state', data.state ?? '')
      formData.append('city', data.city ?? '')

      formData.append('status', data.status || 'Active')

      // Append image ONLY if user selected a new one
      if (data.speakerProfilePicture instanceof File) {
        formData.append('speakerProfilePicture', data.speakerProfilePicture)
      }

      const url = defaultValues?._id
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/speakers/${defaultValues._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/speakers`

      const method = defaultValues?._id ? 'PUT' : 'POST'

      const res = await fetchClient(url, {
        method,
        body: formData,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to save speaker')

      toast.success(
        defaultValues
          ? 'Speaker updated successfully!'
          : 'Speaker created successfully!',
        { description: getIndianFormattedDate() }
      )

      await onSave(json.data)
      form.reset()
      clearDraft(DRAFT_KEY)
      setPreview(null)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto custom-scroll mb-20">
        <Form {...form}>
          <form
            id="add-speaker-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-3 pb-20"
          >
            {/* Prefix */}
            <FormField
              control={form.control}
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefix *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select prefix" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {prefix.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Speaker Name */}
            <FormField
              control={form.control}
              name="speakerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaUser />}
                      placeholder="Enter speaker name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile Picture (MOVED HERE) */}
            <FormItem>
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
              </FormControl>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 h-24 w-24 rounded border object-cover"
                />
              )}
            </FormItem>

            

            {/* Specialization */}
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} placeholder="e.g. Urology" />
                  </FormControl>
                </FormItem>
              )}
            />

           

            {/* Affiliation */}
            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliation *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="e.g. Apollo Hospitals"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaGlobe />}
                      placeholder="e.g. India"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* State */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaMapMarkerAlt />}
                      placeholder="e.g. Telangana"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaMapMarkerAlt />}
                      placeholder="e.g. Hyderabad"
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
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select status" />
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
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      {/* Footer */}
      <div className="bg-background sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="add-speaker-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
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
