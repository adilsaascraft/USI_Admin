// components/NewCustomDatePicker.tsx
import { Controller, useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useMemo } from "react"

interface Props {
  name: string
  label?: string
}

export const CustomDatePicker = ({ name, label }: Props) => {
  const { control, watch, setValue } = useFormContext()

  const dateValue = watch(name)

  // ------------------------------------------------------
  // FIX: INDIA TIMEZONE DATE
  // ------------------------------------------------------
  const getISTDate = () => {
    const now = new Date()
    const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    return ist
  }

  const todayIST = getISTDate()
  const tomorrowIST = new Date(todayIST)
  tomorrowIST.setDate(tomorrowIST.getDate() + 1)

  // Format helper
  const format = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}/${d.getFullYear()}`

  // ------------------------------------------------------
  // DEFAULT START = TODAY, END = TOMORROW
  // (Before UI parse)
  // ------------------------------------------------------
  useEffect(() => {
    if (!dateValue) {
      const defaultDate = name.toLowerCase().includes("end")
        ? tomorrowIST
        : todayIST

      setValue(name, format(defaultDate), { shouldValidate: true })
    }
  }, [dateValue, name, setValue])

  // ------------------------------------------------------
  // PARSE CURRENT VALUE
  // ------------------------------------------------------
  const parseDate = (date: string | undefined) => {
    if (!date) return { day: "01", month: "01", year: "2025" }
    const [day, month, year] = date.split("/")
    return { day, month, year }
  }

  const current = parseDate(dateValue)

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month, 0).getDate()

  // ------------------------------------------------------
  // DISABLE PAST DATES
  // ------------------------------------------------------
  const isPastYear = (year: string) => Number(year) < todayIST.getFullYear()

  const isPastMonth = (month: string, year: string) =>
    Number(year) === todayIST.getFullYear() &&
    Number(month) < todayIST.getMonth() + 1

  const isPastDay = (day: string, month: string, year: string) =>
    Number(year) === todayIST.getFullYear() &&
    Number(month) === todayIST.getMonth() + 1 &&
    Number(day) < todayIST.getDate()

  // ------------------------------------------------------
  // HANDLE CHANGE
  // ------------------------------------------------------
  const handleChange = (type: "day" | "month" | "year", value: string) => {
    let { day, month, year } = current

    if (type === "day") day = value
    if (type === "month") month = value
    if (type === "year") year = value

    // Fix invalid days
    const maxDays = getDaysInMonth(Number(month), Number(year))
    if (Number(day) > maxDays) {
      day = String(maxDays).padStart(2, "0")
    }

    setValue(name, `${day}/${month}/${year}`)
  }

  // ------------------------------------------------------
  // LIST OPTIONS
  // ------------------------------------------------------
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const currentYear = todayIST.getFullYear()
  const years = Array.from({ length: 2050 - currentYear + 1 }, (_, i) =>
    String(currentYear + i)
  )

  const days = useMemo(() => {
    const max = getDaysInMonth(Number(current.month), Number(current.year))
    return Array.from({ length: max }, (_, i) => String(i + 1).padStart(2, "0"))
  }, [current.month, current.year])

  // ------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label className="px-1">{label}</Label>}

      <div className="flex gap-2">

        {/* Month */}
        <Select
          onValueChange={(val) => handleChange("month", val)}
          value={current.month}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem
                key={m.value}
                value={m.value}
                disabled={isPastMonth(m.value, current.year)}
              >
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Day */}
        <Select
          onValueChange={(val) => handleChange("day", val)}
          value={current.day}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem
                key={d}
                value={d}
                disabled={isPastDay(d, current.month, current.year)}
              >
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select
          onValueChange={(val) => handleChange("year", val)}
          value={current.year}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y} disabled={isPastYear(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
