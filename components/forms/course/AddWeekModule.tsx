'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Textarea } from '@/components/ui/textarea'
import RichTextEditor from '@/components/RichTextEditor'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { apiRequest } from '@/lib/apiRequest'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SheetClose,
  toast,
} from '@/lib/imports'

import {
  CourseModuleSchema,
  CourseModuleValues,
} from '@/validations/courseModuleSchema'

type Props = {
  courseId: string
  defaultValues?: Partial<CourseModuleValues> & { _id?: string }
  onSave?: () => void
}

export default function AddCourseModule({
  courseId,
  defaultValues,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [weekCategories, setWeekCategories] = useState<any[]>([])

  const DRAFT_KEY = 'add-module-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const courseDraft = drafts[DRAFT_KEY]

  /* ================= FORM ================= */

  const form = useForm<CourseModuleValues>({
    resolver: zodResolver(CourseModuleSchema),
    defaultValues: {
      weekCategoryId: '',
      contentType: 'video',
      topicName: '',
      aboutTopic: '',
      contentUrl: '',
      videoDuration: '',
      description: '',
      additionalResources: [{ value: '' }],
    },
  })

  const { control, register, handleSubmit, reset, watch } = form

  /* ================= PREFILL (EDIT MODE) ================= */

  const resolvedWeekCategoryId = defaultValues?.weekCategoryId


  useEffect(() => {
    if (!defaultValues?._id) return
    if (!weekCategories.length) return // ⬅️ CRITICAL

    reset({
      weekCategoryId: resolvedWeekCategoryId || '',
      contentType: defaultValues.contentType ?? 'video',
      topicName: defaultValues.topicName ?? '',
      aboutTopic: defaultValues.aboutTopic ?? '',
      contentUrl: defaultValues.contentUrl ?? '',
      videoDuration: defaultValues.videoDuration ?? '',
      description: defaultValues.description ?? '',
      additionalResources:
        defaultValues.additionalResources?.length
          ? defaultValues.additionalResources.map((r) => ({
            value: typeof r === 'string' ? r : r.value,
          }))
          : [{ value: '' }],
    })
  }, [defaultValues, weekCategories, reset])


  /* ================= DRAFT ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = watch((values) => setDraft(DRAFT_KEY, values))
    return () => sub.unsubscribe()
  }, [watch, defaultValues?._id])

  /* ================= FIELD ARRAYS ================= */

  const resourcesArray = useFieldArray({
    control,
    name: 'additionalResources',
  })

  /* ================= FETCH WEEK CATEGORIES ================= */

  useEffect(() => {
    apiRequest({
      endpoint: `/courses/${courseId}/week-categories/active`,
      method: 'GET',
    }).then((res: { data: any }) => setWeekCategories(res.data || []))
  }, [courseId])

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: CourseModuleValues) => {
    try {
      setLoading(true)

      const payload = {
        topicName: values.topicName.trim(),
        contentType: values.contentType,
        aboutTopic: values.aboutTopic?.trim() || undefined,
        contentUrl: values.contentUrl.trim(),
        videoDuration: values.videoDuration?.trim() || undefined,
        description: values.description?.trim() || undefined,
        additionalResources: (values.additionalResources ?? [])
          .map((r) => r.value.trim())
          .filter(Boolean),
      }

      if (defaultValues?._id) {
        await apiRequest({
          endpoint: `/admin/modules/${defaultValues._id}`,
          method: 'PUT',
          body: payload,
          showToast: true,
          successMessage: 'Module Updated Successfully',
        })
      } else {
        await apiRequest({
          endpoint: `/admin/courses/${courseId}/week-categories/${values.weekCategoryId}/modules`,
          method: 'POST',
          body: payload,
          showToast: true,
          successMessage: 'Module Created Successfully',
        })
      }

      onSave?.()
      reset()
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
      <div className="flex-1 overflow-y-auto custom-scroll mb-20">
        <Form {...form}>
          <form
            id="module-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 px-4"
          >
            {/* Week Category */}
            <FormField
              control={control}
              name="weekCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week Category *</FormLabel>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full p-3'>
                        <SelectValue placeholder="Select week category" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {weekCategories.map((w) => (
                        <SelectItem key={w._id} value={w._id}>
                          {w.weekCategoryName} {/* ✅ UI LABEL */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Content Type */}
            <FormField
              control={control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full p-3'>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic Name */}
            <FormItem>
              <FormLabel>Topic Name *</FormLabel>
              <Input
                {...register('topicName')}
                placeholder="e.g. Urinary Tract Infections"
              />
            </FormItem>

            {/* About Topic */}
            <FormItem>
              <FormLabel>About Topic</FormLabel>
              <Textarea
                {...register('aboutTopic')}
                rows={4}
                placeholder="Short overview of this topic…"
              />
            </FormItem>

            {/* Content URL */}
            <FormItem>
              <FormLabel>Content URL *</FormLabel>
              <Input
                {...register('contentUrl')}
                placeholder="e.g. https://vimeo.com/123456"
              />
            </FormItem>

            {/* Video Duration */}
            <FormItem>
              <FormLabel>Video Duration (Minutes:Seconds)</FormLabel>
              <Input
                {...register('videoDuration')}
                placeholder="e.g. 20:45"
              />
            </FormItem>

            {/* Additional Resources */}
            <div className="space-y-2">
              <FormLabel>Additional Resources</FormLabel>

              {resourcesArray.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <Input
                    {...register(`additionalResources.${i}.value`)}
                    placeholder={`Resource link ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => resourcesArray.remove(i)}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                className='bg-orange-600 hover:bg-orange-700 text-white'
                onClick={() => resourcesArray.append({ value: '' })}
              >
                + Add Resource
              </Button>
            </div>

            {/* Description */}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Write detailed description here…"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button form="module-form" type="submit" disabled={loading}
          className='bg-orange-600 hover:bg-orange-700 text-white'>
          {loading
            ? defaultValues?._id
              ? 'Updating...'
              : 'Creating...'
            : defaultValues?._id
              ? 'Update'
              : 'Create'}
        </Button>
      </div>
    </div>
  )
}
