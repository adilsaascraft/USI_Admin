'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { WeekCategorySchema, WeekCategoryValues } from '@/validations/weekcategory'
import { FaCalendarWeek } from 'react-icons/fa'
import InputWithIcon from '@/components/InputWithIcon'
import {
  useForm,
  zodResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/imports'
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SheetClose,
  toast,
} from '@/lib/imports'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

type Props = {
  courseId: string
  defaultValues?: {
    _id: string
    weekCategoryName: string
    status: 'Active' | 'Inactive'
  }
  onSave: () => void
}

export default function AddWeekCategoryForm({
  courseId,
  defaultValues,
  onSave,
}: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<WeekCategoryValues>({
    resolver: zodResolver(WeekCategorySchema),
    defaultValues: {
      weekCategoryName: '',
      status: 'Active',
      courseId,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        weekCategoryName: defaultValues.weekCategoryName,
        status: defaultValues.status,
        courseId,
      })
    }
  }, [defaultValues, courseId, form])

  const onSubmit = async (data: z.infer<typeof WeekCategorySchema>) => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      if (!token) throw new Error('Unauthorized')

      const isEdit = Boolean(defaultValues?._id)

      const endpoint = isEdit
        ? `/api/admin/week-categories/${defaultValues!._id}`
        : `/api/admin/courses/${courseId}/week-categories`

      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(
        isEdit ? 'Week updated successfully!' : 'Week created successfully!',
        { description: getIndianFormattedDate() }
      )

      onSave()
      form.reset()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-4 p-4"
        >
          <FormField
            control={form.control}
            name="weekCategoryName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week Category Name *</FormLabel>
                <FormControl>
                  <InputWithIcon
                    {...field}
                    placeholder="e.g. Week 1 - Intro to Urology"
                    icon={<FaCalendarWeek />}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full p-3'>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Footer */}
      <div className="border-t p-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
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
