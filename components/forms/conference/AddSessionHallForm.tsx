'use client'

import React, { useEffect, useState } from 'react'
import { SessionHallSchema, SessionHallValues } from '@/validations/hallSchema'
import { z } from 'zod'
import { FaUserPlus } from "react-icons/fa";
import InputWithIcon from "@/components/InputWithIcon";
import {
  zodResolver,
  useForm,
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
  status,
} from '@/lib/imports'
import { getIndianFormattedDate } from '@/lib/formatIndianDate';

type AddHallFormProps = {
  conferenceId: string
  defaultValues?: Partial<SessionHallValues & { _id: string }>
  onSave: (entry: SessionHallValues & { _id: string }) => void
}

export default function AddSessionHallForm({ conferenceId, defaultValues, onSave }: AddHallFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<SessionHallValues>({
    resolver: zodResolver(SessionHallSchema),
    defaultValues: {
      hallName: '',
      status: 'Active',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    } else {
      form.reset({ ...form.getValues(), status: 'Active' })
    }
  }, [defaultValues, form])

  async function onSubmit(data: z.infer<typeof SessionHallSchema>) {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Unauthorized! Token not found.")

      let url = ""
      let method = ""
      let body = JSON.stringify(data)

      if (defaultValues?._id) {
        // Edit Mode
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/event-admin/agenda-session-halls/${defaultValues._id}`
        method = "PUT"
      } else {
        // Add Mode
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/event-admin/events/${conferenceId}/agenda-session-halls`
        method = "POST"
        body = JSON.stringify({ ...data })
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to save session hall")

      toast.success(
        defaultValues?._id
          ? "Session Hall updated successfully!"
          : "Session Hall created successfully!",
        {
          description: getIndianFormattedDate(),
        }
      )

      onSave?.(result.data)
      form.reset()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto custom-scroll">
        <Form {...form}>
          <form
            id="hall-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pr-3 pl-3"
          >
            {/* Hall Name */}
            <FormField
              control={form.control}
              name="hallName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Hall Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      placeholder="Type Session hall name e.g. Hall 1"
                      icon={<FaUserPlus />}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button type="button" variant="outline" className="border border-gray-400" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="hall-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? defaultValues?._id
              ? "Updating..."
              : "Creating..."
            : defaultValues?._id
            ? "Update"
            : "Create"}
        </Button>
      </div>
    </div>
  )
}
