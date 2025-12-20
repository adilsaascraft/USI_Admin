"use client"
import React, { useEffect, useState } from "react"
import { EventFormSchema, EventFormValues } from "@/validations/eventSchema"
import { generateShortName } from "@/utils/generateShortName"
import {FaCalendarAlt, FaCalendarDay,FaHashtag, FaSortAlphaUp} from "react-icons/fa";
import InputWithIcon from "@/components/InputWithIcon";
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

// New Custom Date Helper
const toDate = (str: string) => {
  const [d, m, y] = str.split("/").map(Number)
  return new Date(y, m - 1, d)
}

// ---- Props ----
interface AddEventFormProps {
  onSuccess: (newEvent: any) => void
  eventToEdit?: any | null
}

export default function AddEventForm({ onSuccess, eventToEdit }: AddEventFormProps) {
  const [venues, setVenues] = useState<any[]>([])
  const [organizers, setOrganizers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isShortNameEdited, setIsShortNameEdited] = useState(false)

  // RHF setup
  const form = useForm<EventFormValues>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      eventName: eventToEdit?.eventName || "",
      shortName: eventToEdit?.shortName || "",
      eventImage: "",
      venueName: eventToEdit?.venueName?._id || "",
      timeZone: eventToEdit?.timeZone || "",
      startDate: eventToEdit?.startDate || "",
      endDate: eventToEdit?.endDate || "",
      startTime: eventToEdit?.startTime || "",
      endTime: eventToEdit?.endTime || "",
      eventCode: eventToEdit?.eventCode || "",
      regNum: eventToEdit?.regNum || "",
      country: eventToEdit?.country || "",
      organizer: eventToEdit?.organizer?._id || "",
      department: eventToEdit?.department?._id || "",
      eventCategory: eventToEdit?.eventCategory || "",
      eventType: eventToEdit?.eventType || "",
      registrationType: eventToEdit?.registrationType || "",
      currencyType: eventToEdit?.currencyType || "",
      isEventApp: eventToEdit?.isEventApp || false,
    },
  })

  // Auto-generate short name from eventName
  const eventName = form.watch("eventName")
  useEffect(() => {
    if (!eventName?.trim()) {
      form.setValue("shortName", "")
      setIsShortNameEdited(false)
    } else if (!isShortNameEdited && !eventToEdit) {
      const generated = generateShortName(eventName)
      form.setValue("shortName", generated, { shouldValidate: true })
    }
  }, [eventName, isShortNameEdited, eventToEdit, form])

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [venueRes, organizerRes, departmentRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/venues`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizers`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`),
        ])
        const [venueJson, organizerJson, departmentJson] = await Promise.all([
          venueRes.json(),
          organizerRes.json(),
          departmentRes.json(),
        ])
        setVenues(venueJson.data || [])
        setOrganizers(organizerJson.data || [])
        setDepartments(departmentJson.data || [])
      } catch (error) {
        console.error("❌ Failed to fetch dropdown data", error)
      }
    }
    fetchDropdownData()
  }, [])

      // New Custom date picker 
  
    const { watch, setValue } = form
  
    const startDate = watch("startDate")
    const endDate = watch("endDate")
  
    // AUTO FIX END DATE
    useEffect(() => {
      if (!startDate || !endDate) return
  
      const s = toDate(startDate)
      const e = toDate(endDate)
  
      if (e <= s) {
        const newEnd = new Date(s)
        newEnd.setDate(newEnd.getDate() + 1)
  
        const formatted = `${String(newEnd.getDate()).padStart(2, "0")}/${String(
          newEnd.getMonth() + 1
        ).padStart(2, "0")}/${newEnd.getFullYear()}`
  
        setValue("endDate", formatted)
      }
    }, [startDate])

  // Submit Handler
  async function onSubmit(data: EventFormValues) {
    try {
      setLoading(true)
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (key === "eventImage" && value instanceof FileList) {
            formData.append("eventImage", value[0])
          } else {
            formData.append(key, value as string)
          }
        }
      })

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`
      let method: "POST" | "PUT" = "POST"

      if (eventToEdit?._id) {
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${eventToEdit._id}`
        method = "PUT"
      }

      const res = await fetchClient(url, {
        method,
        body: formData,
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Something went wrong")

      if (eventToEdit) {
     toast("Event has been updated successfully!", {
    description: getIndianFormattedDate(),
  })
     } else {
     toast("Event has been created successfully!", {
    description: getIndianFormattedDate(),
  })
    }
      form.reset()
      onSuccess(result.data)

      // ✅ revalidate SWR cache
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/events`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to save event")
    } finally {
      setLoading(false)
    }
  }

  // Watch for registration type changes
  const registrationTypeValue = form.watch("registrationType")
  const isPaidEvent = registrationTypeValue === "paid"

  

  return (
    <div className="flex flex-col h-screen">
      <div className="p-3 border-b">
        <h2 className="text-xl font-semibold">
          {eventToEdit ? "Edit Event" : "Add Event"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll mb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-3">
            {/* ---- Event Name ---- */}
            <FormField
              control={form.control}
              name="eventName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name *</FormLabel>
                  <FormControl>
                  <InputWithIcon {...field} placeholder="Type event name" icon={<FaCalendarAlt />} />
                </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---- Short Name ---- */}
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name *</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      placeholder="Auto-generated short name"
                      icon={<FaSortAlphaUp/>}
                      {...field}
                      onChange={(e) => {
                        setIsShortNameEdited(true)
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---- Image Upload ---- */}
            <FormField
              control={form.control}
              name="eventImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image *</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files as FileList)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        {/* Venue Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <FormField
          control={form.control}
          name="venueName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Venue *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full p-3">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue._id} value={venue._id}>
                      {venue.venueName}
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
      <FormItem className="w-full">
        <FormLabel>Time Zone *</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger className="w-full p-3">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {timezones.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
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
        {/* Organizer Dropdown */}
        <FormField
          control={form.control}
          name="organizer"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full sm:w-1/2">
              <FormLabel>Organizer *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full p-3">
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  {organizers.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.organizerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Department Dropdown */}
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full sm:w-1/2">
              <FormLabel>Department *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full p-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dep) => (
                    <SelectItem key={dep._id} value={dep._id}>
                      {dep.departmentName}
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
       {/* Footer Buttons */}
         {/* ---- Footer ---- */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between">
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

