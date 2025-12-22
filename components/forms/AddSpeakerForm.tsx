'use client'

import React, { useEffect, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
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
import {
  zodResolver,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Select,
  Input,
} from '@/lib/imports'
import { Button, SheetClose, toast, status, prefix } from '@/lib/imports'
import { fetchClient } from '@/lib/fetchClient'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

type AddSpeakerFormProps = {
  defaultValues?: SpeakerFormValues & { _id?: string }
  onSave: (formData: SpeakerFormValues & { _id?: string }) => Promise<void>
}

export default function AddSpeakerForm({
  defaultValues,
  onSave,
}: AddSpeakerFormProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(
    defaultValues?.speakerProfilePicture || null
  )

  const DRAFT_KEY = 'add-speaker-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const speakerDraft = drafts[DRAFT_KEY]

  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(SpeakerFormSchema),
    defaultValues: defaultValues ||
      speakerDraft || {
        prefix: '',
        speakerName: '',
        degree: '',
        specialization: '',
        experience: '',
        affiliation: '',
        country: '',
        state: '',
        city: '',
        speakerProfilePicture: '',
      },
  })

  // ✅ Save draft only in Add mode
  useEffect(() => {
    if (defaultValues?._id) return
    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values)
    })
    return () => subscription.unsubscribe()
  }, [form.watch, defaultValues?._id])

  // Handle image change
  const handleImageChange = (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    form.setValue('speakerProfilePicture', file as any)
  }

  async function onSubmit(data: SpeakerFormValues & { _id?: string }) {
    try {
      setLoading(true)

      const formData = new FormData()

      formData.append('prefix', data.prefix)
      formData.append('speakerName', data.speakerName)
      formData.append('degree', data.degree)
      formData.append('specialization', data.specialization || '')
      formData.append('experience', data.experience || '')
      formData.append('affiliation', data.affiliation)
      formData.append('country', data.country)
      formData.append('state', data.state)
      formData.append('city', data.city)
      formData.append('status', data.status || 'Active')

      // ✅ Image logic
      if ((data.speakerProfilePicture as any) instanceof File) {
        formData.append('speakerProfilePicture', data.speakerProfilePicture)
      } else if (typeof data.speakerProfilePicture === 'string') {
        // re-send existing image in update mode
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

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to save speaker')

      toast.success(
        defaultValues?._id
          ? 'Speaker updated successfully!'
          : 'Speaker created successfully!',
        { description: getIndianFormattedDate() }
      )

      onSave?.(result.data)
      form.reset()
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form
            id="add-speaker-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-3"
          >
            {/* Prefix */}
                       <FormField
                         control={form.control}
                         name="prefix"
                         render={({ field }) => (
                           <FormItem className="w-full">
                             <FormLabel>Prefix *</FormLabel>
                             <Select
                               onValueChange={field.onChange}
                               defaultValue={field.value}
                             >
                               <FormControl>
                                 <SelectTrigger className="w-full p-3">
                                   <SelectValue placeholder="Select prefix" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 {prefix.map((s) => (
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

            {/* Speaker Name */}
            <FormField
              control={form.control}
              name="speakerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} icon={<FaUser />} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Degree */}
            <FormField
              control={form.control}
              name="degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree *</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} icon={<FaGraduationCap />} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialization */}
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Experience */}
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Profile Picture */}
            <FormItem>
              <FormLabel>Profile Picture *</FormLabel>
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
                  className="mt-2 h-24 w-24 rounded object-cover border"
                />
              )}
              <FormMessage />
            </FormItem>

            {/* Affiliation */}
            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliation *</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} />
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
                    <InputWithIcon {...field} icon={<FaGlobe />} />
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
                    <InputWithIcon {...field} icon={<FaMapMarkerAlt />} />
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
                    <InputWithIcon {...field} icon={<FaMapMarkerAlt />} />
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
          className="bg-sky-800 text-white hover:bg-sky-900"
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
