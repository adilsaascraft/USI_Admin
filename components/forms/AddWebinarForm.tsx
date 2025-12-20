"use client"

import React, { useEffect, useRef, useState } from "react"
import { useFormDraftStore } from "@/stores/useFormDraftStore";
import { EventFormSchema, EventFormValues } from "@/validations/eventSchema"
import { generateShortName } from "@/utils/generateShortName"
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaHashtag,
  FaSortAlphaUp,
} from "react-icons/fa"
import InputWithIcon from "@/components/InputWithIcon"
import { getIndianFormattedDate } from "@/lib/formatIndianDate"
import {
  z,
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
  Switch,
  Label,
  SheetClose,
} from "@/lib/imports"
import { CustomDatePicker, CustomTimePicker } from "@/lib/imports"
import {
  eventCategories,
  eventType,
  registrationType,
  currencyType,
  timezones,
} from "@/lib/imports"
import { mutate } from "swr"
import { fetchClient } from "@/lib/fetchClient"

/* ================= IMAGE CONSTANTS ================= */
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

/* ================= PROPS ================= */
interface AddEventFormProps {
  onSuccess: (newEvent: any) => void
  eventToEdit?: any | null
}

export default function AddEventForm({
  onSuccess,
  eventToEdit,
}: AddEventFormProps) {
  const [venues, setVenues] = useState<any[]>([])
  const [organizers, setOrganizers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isShortNameEdited, setIsShortNameEdited] = useState(false)
  const DRAFT_KEY = "add-event-form";
  const { drafts, setDraft, clearDraft } = useFormDraftStore();
  const eventDraft = drafts[DRAFT_KEY];

  /* ================= IMAGE STATE ================= */
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    eventToEdit?.eventImage || null
  )

  /* ================= FORM ================= */
  const form = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: eventToEdit || eventDraft ||{
      eventName: eventToEdit?.eventName || "",
      shortName: eventToEdit?.shortName || "",
      eventImage: eventToEdit?.eventImage || "",
      venueName: eventToEdit?.venueName?._id || "",
      timeZone: eventToEdit?.timeZone || "",
      startDate: eventToEdit?.startDate || "",
      endDate: eventToEdit?.endDate || "",
      startTime: eventToEdit?.startTime || "",
      endTime: eventToEdit?.endTime || "",
      eventCode: eventToEdit?.eventCode || "",
      regNum: eventToEdit?.regNum || "",
      country: eventToEdit?.country || "",
      state: eventToEdit?.state || "",
      city: eventToEdit?.city || "",
      organizer: eventToEdit?.organizer?._id || "",
      department: eventToEdit?.department?._id || "",
      eventCategory: eventToEdit?.eventCategory || "",
      eventType: eventToEdit?.eventType || "",
      registrationType: eventToEdit?.registrationType || "",
      currencyType: eventToEdit?.currencyType || "",
      isEventApp: eventToEdit?.isEventApp || false,
    },
  })

  // Persist draft to zustand store
    useEffect(() => {
    if (eventToEdit?._id) return; // ❌ don't persist edit mode
  
    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values);
    });
  
    return () => subscription.unsubscribe();
  }, [form.watch, eventToEdit?._id]);
  

  /* ================= EDIT MODE IMAGE SYNC ================= */
  useEffect(() => {
    if (eventToEdit?.eventImage) {
      form.setValue("eventImage", eventToEdit.eventImage)
      setImagePreview(eventToEdit.eventImage)
    }
  }, [eventToEdit, form])

  /* ================= SHORT NAME AUTO GEN ================= */
  const eventName = form.watch("eventName")
  useEffect(() => {
    if (!eventName?.trim()) {
      form.setValue("shortName", "")
      setIsShortNameEdited(false)
    } else if (!isShortNameEdited && !eventToEdit) {
      form.setValue("shortName", generateShortName(eventName), {
        shouldValidate: true,
      })
    }
  }, [eventName, isShortNameEdited, eventToEdit, form])

  /* ================= IMAGE RESET HELPER ================= */
  const resetEventImage = () => {
    if (eventToEdit?.eventImage) {
      form.setValue("eventImage", eventToEdit.eventImage, {
        shouldValidate: true,
      })
      setImagePreview(eventToEdit.eventImage)
    } else {
      form.setValue("eventImage", "", { shouldValidate: true })
      setImagePreview(null)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /* ================= IMAGE CHANGE HANDLER ================= */
  const handleEventImageChange = (files?: FileList) => {
    if (!files || !files[0]) return

    const file = files[0]

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, WEBP images are allowed")
      resetEventImage()
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be ≤ 5 MB")
      resetEventImage()
      return
    }

    const img = new Image()
    img.onload = () => {
      if (img.width !== 300 || img.height !== 250) {
        toast.error("Image must be exactly 300 × 250 px")
        resetEventImage()
        return
      }

      const url = URL.createObjectURL(file)
      setImagePreview(url)
      form.setValue("eventImage", files, { shouldValidate: true })
    }

    img.onerror = () => {
      toast.error("Invalid image file")
      resetEventImage()
    }

    img.src = URL.createObjectURL(file)
  }

  /* ================= FETCH DROPDOWNS ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [v, o, d] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/venues`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizers`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`),
        ])
        setVenues((await v.json()).data || [])
        setOrganizers((await o.json()).data || [])
        setDepartments((await d.json()).data || [])
      } catch {
        toast.error("Failed to load dropdown data")
      }
    }
    fetchData()
  }, [])

  /* ================= SUBMIT ================= */
  async function onSubmit(data: EventFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (!value) return

        if (key === "eventImage") {
          if (value instanceof FileList) {
            formData.append("eventImage", value[0])
          } else if (typeof value === "string") {
            formData.append("eventImage", value)
          }
        } else {
          formData.append(key, value as string)
        }
      })

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`
      let method: "POST" | "PUT" = "POST"

      if (eventToEdit?._id) {
        url += `/${eventToEdit._id}`
        method = "PUT"
      }

      const res = await fetchWithAuth(url, { method, body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success(
        eventToEdit ? "Event updated successfully!" : "Event created successfully!",
        { description: getIndianFormattedDate() }
      )

      form.reset()
      clearDraft(DRAFT_KEY)
      onSuccess(result.data)
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/events`)
    } catch (err: any) {
      toast.error(err.message || "Failed to save event")
    } finally {
      setLoading(false)
    }
  }

  const registrationTypeValue = form.watch("registrationType")
  const isPaidEvent = registrationTypeValue === "paid"

  function setValue(name: string, value: boolean) { form.setValue(name as keyof z.infer<typeof EventFormSchema>, value) }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {eventToEdit ? "Edit Event" : "Add Event"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-3">

            {/* EVENT NAME */}
            <FormField
              control={form.control}
              name="eventName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon {...field} icon={<FaCalendarAlt />}
                    placeholder="type event name..." />
                    
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SHORT NAME */}
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      {...field}
                      icon={<FaSortAlphaUp />}
                      onChange={(e) => {
                        setIsShortNameEdited(true)
                        field.onChange(e)
                      }}
                      placeholder="short name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EVENT IMAGE */}
            <FormField
              control={form.control}
              name="eventImage"
              render={() => (
                <FormItem>
                  <FormLabel>Event Image *</FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleEventImageChange(e.target.files || undefined)
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

       {/* Venue and Time Zone Dropdown */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
  {/* Venue */}
  <FormField
    control={form.control}
    name="venueName"
    render={({ field }) => (
      <FormItem className="w-full min-w-0">
        <FormLabel>Venue *</FormLabel>

        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger className="w-full p-3 overflow-hidden">
            <SelectValue
              placeholder="Select venue"
              className="block w-full truncate"
            />
          </SelectTrigger>

          <SelectContent>
            {venues.map((venue) => (
              <SelectItem key={venue._id} value={venue._id}>
                <span
                  className="block max-w-[260px] truncate"
                  title={venue.venueName}
                >
                  {venue.venueName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FormMessage />
      </FormItem>
    )}
  />

  {/* Time Zone */}
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
</div>


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

{/* Row with Event Code + Registration Number */}
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Event Code */}
      <FormField
        control={form.control}
        name="eventCode"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Event Code *</FormLabel>
            <FormControl>
              <InputWithIcon {...field} placeholder="eg. BAPS2025" icon={<FaCalendarDay />} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Registration Number */}
      <FormField
        control={form.control}
        name="regNum"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Registration Number Start After *</FormLabel>
            <FormControl>
          <InputWithIcon icon={<FaHashtag />}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            onInput={(e) => {
            const input = e.currentTarget
            input.value = input.value.replace(/\D/g, '').slice(0, 5)
            }}
            placeholder="eg. 0, 50, 100, 150, 200 ..."
            {...field}
          />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>
      {/* Organizer + Department */}
<div className="flex flex-col sm:flex-row gap-4 w-full">
  {/* Organizer */}
  <FormField
    control={form.control}
    name="organizer"
    render={({ field }) => (
      <FormItem className="flex flex-col w-full sm:w-1/2 min-w-0">
        <FormLabel>Organizer *</FormLabel>

        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger className="w-full p-3 overflow-hidden">
            <SelectValue
              placeholder="Select organizer"
              className="block w-full truncate"
            />
          </SelectTrigger>

          <SelectContent>
            {organizers.map((org) => (
              <SelectItem key={org._id} value={org._id}>
                <span
                  className="block max-w-[260px] truncate"
                  title={org.organizerName}
                >
                  {org.organizerName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FormMessage />
      </FormItem>
    )}
  />

  {/* Department */}
  <FormField
    control={form.control}
    name="department"
    render={({ field }) => (
      <FormItem className="flex flex-col w-full sm:w-1/2 min-w-0">
        <FormLabel>Department *</FormLabel>

        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger className="w-full p-3 overflow-hidden">
            <SelectValue
              placeholder="Select department"
              className="block w-full truncate"
            />
          </SelectTrigger>

          <SelectContent>
            {departments.map((dep) => (
              <SelectItem key={dep._id} value={dep._id}>
                <span
                  className="block max-w-[260px] truncate"
                  title={dep.departmentName}
                >
                  {dep.departmentName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FormMessage />
      </FormItem>
    )}
  />
</div>


        {/* Row with EventCategory + EventType */}
<div className="flex flex-col sm:flex-row gap-4 w-full">
  {/* EventCategory */}
  <FormField
    control={form.control}
    name="eventCategory"
    render={({ field }) => (
      <FormItem className="w-full sm:w-1/2">
        <FormLabel>Event Category *</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full p-3">
              <SelectValue placeholder="Select an event category" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {eventCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Event Type */}
  <FormField
    control={form.control}
    name="eventType"
    render={({ field }) => (
      <FormItem className="w-full sm:w-1/2">
        <FormLabel>Event Type *</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full p-3">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {eventType.map((event) => (
              <SelectItem key={event.value} value={event.value}>
                {event.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

{/* Row with Registration Type + Currency */}
<div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
  {/* Registration Type */}
  <FormField
    control={form.control}
    name="registrationType"
    render={({ field }) => (
      <FormItem className="w-full sm:w-1/2">
        <FormLabel>Registration Type *</FormLabel>
        <Select
          onValueChange={(value) => {
            field.onChange(value)
            if (value === "free") {
              form.setValue("currencyType", "")
            }
          }}
          defaultValue={field.value}
        >
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

  {/* Currency Type */}
  <FormField
    control={form.control}
    name="currencyType"
    render={({ field }) => (
      <FormItem className="w-full sm:w-1/2">
        <FormLabel>Currency Type</FormLabel>
        <Select
          onValueChange={field.onChange}
          value={field.value}
          disabled={!isPaidEvent}
        >
          <FormControl>
            <SelectTrigger className="w-full p-3">
              <SelectValue placeholder="Select currency type" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {currencyType.map((curr) => (
              <SelectItem key={curr.value} value={curr.value}>
                {curr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

     <LocationSelector form={form} />

          <div className="flex items-center space-x-2 pt-4">
            <Label htmlFor="event-app">Event App</Label>
             <Switch
               id="event-app"
               checked={form.watch('isEventApp')}
               onCheckedChange={(checked) => setValue('isEventApp', checked)}
             />
           </div>

      </form>
    </Form>
    </div>

         {/* ---- Footer ---- */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between bg-background">
        <SheetClose asChild>
          <Button type="button" variant="outline" className="border border-gray-400">
            Close
          </Button>
        </SheetClose>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-sky-800 text-white hover:bg-sky-900"
        >
          {loading ? "Saving..." : eventToEdit ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

