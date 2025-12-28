'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiRequest'
import {
  AssignFacultySchema,
  AssignFacultyValues,
} from '@/validations/facultySchema'
import { z } from 'zod'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  zodResolver,
  useForm,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  cn,
  Check,
  ChevronsUpDown,
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
  facultyType,
} from '@/lib/imports'
import { fetchClient } from '@/lib/fetchClient'

type SpeakerType = {
  _id: string
  speakerName: string
}

type AddFacultyFormProps = {
  webinarId: string
  defaultValues?: Partial<AssignFacultyValues & { _id: string }>
  onSave: (entry: AssignFacultyValues & { _id: string }) => void
}

export default function AddFacultyForm({
  webinarId,
  defaultValues,
  onSave,
}: AddFacultyFormProps) {
  const [loading, setLoading] = useState(false)
  const [dropdownLoading, setDropdownLoading] = useState(true)
  const [speakers, setSpeakers] = useState<SpeakerType[]>([])
  const [open, setOpen] = useState(false)

  const form = useForm<AssignFacultyValues>({
    resolver: zodResolver(AssignFacultySchema),
    defaultValues: {
      webinarId,
      speakerId: '',
      facultyType: '',
      ...defaultValues,
    },
  })

  // ==========================
  // Fetch active speakers
  // ==========================
  useEffect(() => {
    async function fetchSpeakers() {
      try {
        setDropdownLoading(true)
        const res = await fetchClient(
          `${process.env.NEXT_PUBLIC_API_URL}/api/speakers/active`
        )
        const data = await res.json()
        setSpeakers(data.data || [])
      } catch (err: any) {
        toast.error(err.message || 'Failed to load speakers ❌')
      } finally {
        setDropdownLoading(false)
      }
    }

    fetchSpeakers()
  }, [])

  // ==========================
  // Submit
  // ==========================
  async function onSubmit(data: z.infer<typeof AssignFacultySchema>) {
    try {
      setLoading(true)

      const bodyData = {
        speakerId: data.speakerId,
        facultyType: data.facultyType,
      }

      await apiRequest<typeof bodyData>({
        endpoint: `/api/admin/assign-speakers/${webinarId}`,
        method: 'POST',
        body: bodyData,
        showToast: true,
        successMessage: 'Speaker assigned successfully!',
        onSuccess: (res) => {
          onSave(res.data)
          form.reset({
            webinarId,
            speakerId: '',
            facultyType: '',
          })
        },
      })
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto custom-scroll">
        <Form {...form}>
          <form
            id="assign-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-3"
          >
            {/* Speaker dropdown */}
            <FormField
              control={form.control}
              name="speakerId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Speaker *</FormLabel>

                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={dropdownLoading}
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? speakers.find((s) => s._id === field.value)
                                ?.speakerName
                            : dropdownLoading
                            ? 'Loading speakers...'
                            : 'Select speaker'}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search speaker..." />
                        <CommandList>
                          <CommandEmpty>No speaker found.</CommandEmpty>
                          <CommandGroup>
                            {speakers.map((speaker) => (
                              <CommandItem
                                key={speaker._id}
                                value={speaker.speakerName}
                                onSelect={() => {
                                  field.onChange(speaker._id)
                                  setOpen(false)
                                }}
                              >
                                {speaker.speakerName}
                                <Check
                                  className={cn(
                                    'ml-auto',
                                    speaker._id === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Faculty Type */}
            <FormField
              control={form.control}
              name="facultyType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Faculty Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select faculty type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {facultyType.map((s) => (
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
      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="assign-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading ? 'Assigning...' : 'Assign'}
        </Button>
      </div>
    </div>
  )
}
