// components/CustomTimePicker.tsx
import { Controller, useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"

interface Props {
  name: string
  label?: string
}

export const CustomTimePicker = ({ name, label }: Props) => {
  const { control, watch, setValue } = useFormContext()

  const timeValue = watch(name) // e.g., "10:45 AM"

  // Set default if none exists
  useEffect(() => {
    if (!timeValue) {
      setValue(name, "09:00 AM")
    }
  }, [timeValue, name, setValue])

  const parseTime = (time: string) => {
    const [timePart, meridian] = time.split(" ")
    const [hr, min] = timePart.split(":")
    return { hour: hr, minute: min, meridian }
  }

  const handleChange = (type: "hour" | "minute" | "meridian", value: string) => {
    const { hour, minute, meridian } = parseTime(timeValue || "09:00 AM")

    const newTime = `${type === "hour" ? value : hour}:${type === "minute" ? value : minute} ${
      type === "meridian" ? value : meridian
    }`

    setValue(name, newTime)
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))
  const meridians = ["AM", "PM"]

  const current = parseTime(timeValue || "05:00 PM")

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label className="px-1">{label}</Label>}
      <div className="flex gap-2">
        {/* Hour */}
        <Controller
          name={name}
          control={control}
          render={() => (
            <Select onValueChange={(val) => handleChange("hour", val)} defaultValue={current.hour}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* Minute */}
        <Controller
          name={name}
          control={control}
          render={() => (
            <Select
              onValueChange={(val) => handleChange("minute", val)}
              defaultValue={current.minute}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* AM/PM */}
        <Controller
          name={name}
          control={control}
          render={() => (
            <Select
              onValueChange={(val) => handleChange("meridian", val)}
              defaultValue={current.meridian}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                {meridians.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  )
}
