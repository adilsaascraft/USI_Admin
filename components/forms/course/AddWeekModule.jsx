'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
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
          successMessage: 'Module Update Successfully'
        })
      } else {
        // ✅ CREATE
        await apiRequest({
          endpoint: `/api/admin/courses/${courseId}/week-categories/${values.weekCategoryId}/modules`,
          method: 'POST',
          body: payload,
          showToast: true,
          successMessage: 'Module Created Successfully',
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
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
                      <SelectTrigger className="w-full p-3">
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
              <Input
                {...register('topicName')}
                placeholder="e.g Urinary Tract Infections"
              />
            </FormItem>

            {/* About Topic */}
            <FormItem>
              <FormLabel>About Topic</FormLabel>
              <Textarea
                {...register('aboutTopic')}
                placeholder="Enter about topic... eg. Assessment and management of uncomplicated and complicated infections, antimicrobial stewardship, recurrent infections, and prevention strategies."
                rows={4}
              />
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => questionsArray.remove(i)}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => questionsArray.append({ value: '' })}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                + Add Question
              </Button>
            </div>

            {/* Content URL */}
            <FormItem>
              <FormLabel>Content URL *</FormLabel>
              <Input
                {...register('contentUrl')}
                placeholder="e.g https://vimeo.com/1234"
              />
            </FormItem>

            {/* VIDEO ONLY */}
            {contentType === 'video' && (
              <>
                <FormItem>
                  <FormLabel>Video Duration (Minutes:Seconds)</FormLabel>
                  <Input
                    {...register('videoDuration')}
                    placeholder="e.g. 20:45"
                  />
                </FormItem>

                <div className="space-y-2">
                  <FormLabel>Additional Resources</FormLabel>

                  {resourcesArray.fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input
                        placeholder={`Resource ${i + 1}`}
                        {...register(`additionalResources.${i}.value`)}
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
                    variant="outline"
                    size="sm"
                    onClick={() => resourcesArray.append({ value: '' })}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    + Add Resource
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button
            type="button"
            variant="outline"
            className="border border-gray-400"
            disabled={loading}
          >
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="module-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
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
