'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { apiRequest } from '@/lib/apiRequest'

export default function AddCourseModule({
  courseId,
  defaultValues,
  onSave,
}) {
  const [loading, setLoading] = useState(false)
  const [weekCategories, setWeekCategories] = useState([])

  /* ================= FORM ================= */

  const form = useForm({
    defaultValues: {
      weekCategoryId:
        defaultValues?.weekCategoryId?._id ||
        defaultValues?.weekCategoryId ||
        '',
      contentType: defaultValues?.contentType || 'video',
      topicName: defaultValues?.topicName || '',
      aboutTopic: defaultValues?.aboutTopic || '',
      contentUrl: defaultValues?.contentUrl || '',
      videoDuration: defaultValues?.videoDuration || '',
      additionalQuestions:
        defaultValues?.additionalQuestions?.map((q) => ({ value: q })) || [],
      additionalResources:
        defaultValues?.additionalResources?.map((r) => ({ value: r })) || [],
    },
  })

  const {
    control,
    watch,
    register,
    handleSubmit,
    reset,
  } = form

  const contentType = watch('contentType')

  /* ================= FIELD ARRAYS ================= */

  const questionsArray = useFieldArray({
    control,
    name: 'additionalQuestions',
  })

  const resourcesArray = useFieldArray({
    control,
    name: 'additionalResources',
  })

  /* ================= FETCH WEEK CATEGORIES ================= */

  useEffect(() => {
    apiRequest({
      endpoint: `/api/courses/${courseId}/week-categories/active`,
      method: 'GET',
    }).then((res) => setWeekCategories(res.data || []))
  }, [courseId])

  /* ================= SUBMIT ================= */

  const onSubmit = async (values) => {
    try {
      setLoading(true)

      if (!values.weekCategoryId)
        return toast.error('Week category is required')
      if (!values.topicName.trim())
        return toast.error('Topic name is required')
      if (!values.contentUrl.trim())
        return toast.error('Content URL is required')

      const payload = {
        topicName: values.topicName.trim(),
        contentType: values.contentType,
        aboutTopic: values.aboutTopic?.trim() || undefined,
        contentUrl: values.contentUrl.trim(),
        videoDuration:
          values.contentType === 'video'
            ? values.videoDuration?.trim()
            : undefined,
        additionalQuestions: values.additionalQuestions
          .map((q) => q.value?.trim())
          .filter(Boolean),
        additionalResources: values.additionalResources
          .map((r) => r.value?.trim())
          .filter(Boolean),
      }

      if (defaultValues?._id) {
        // ✅ UPDATE
        await apiRequest({
          endpoint: `/api/admin/modules/${defaultValues._id}`,
          method: 'PUT',
          body: payload,
          showToast: true,
        })
      } else {
        // ✅ CREATE
        await apiRequest({
          endpoint: `/api/admin/courses/${courseId}/week-categories/${values.weekCategoryId}/modules`,
          method: 'POST',
          body: payload,
          showToast: true,
        })
      }

      onSave?.()
      reset()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="overflow-auto">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4">

          {/* Week Category */}
          <FormField
            control={control}
            name="weekCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week Category *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {weekCategories.map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.weekCategoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Topic Name */}
          <FormItem>
            <FormLabel>Topic Name *</FormLabel>
            <Input {...register('topicName')} />
          </FormItem>

          {/* About Topic */}
          <FormItem>
            <FormLabel>About Topic</FormLabel>
            <Input {...register('aboutTopic')} />
          </FormItem>

          {/* Additional Questions */}
          <div className="space-y-2">
            <FormLabel>Additional Questions</FormLabel>

            {questionsArray.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <Input
                  placeholder={`Question ${i + 1}`}
                  {...register(`additionalQuestions.${i}.value`)}
                />
                <Button type="button" variant="ghost" onClick={() => questionsArray.remove(i)}>
                  ✕
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => questionsArray.append({ value: '' })}
            >
              + Add Question
            </Button>
          </div>

          {/* Content URL */}
          <FormItem>
            <FormLabel>Content URL *</FormLabel>
            <Input {...register('contentUrl')} />
          </FormItem>

          {/* VIDEO ONLY */}
          {contentType === 'video' && (
            <>
              <FormItem>
                <FormLabel>Video Duration</FormLabel>
                <Input {...register('videoDuration')} placeholder="e.g. 20:45" />
              </FormItem>

              <div className="space-y-2">
                <FormLabel>Additional Resources</FormLabel>

                {resourcesArray.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input
                      placeholder={`Resource ${i + 1}`}
                      {...register(`additionalResources.${i}.value`)}
                    />
                    <Button type="button" variant="ghost" onClick={() => resourcesArray.remove(i)}>
                      ✕
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resourcesArray.append({ value: '' })}
                >
                  + Add Resource
                </Button>
              </div>
            </>
          )}

          {/* FOOTER */}
          <div className="flex justify-between border-t pt-4">
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : defaultValues?._id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
