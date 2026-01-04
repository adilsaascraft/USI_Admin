'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useMemo } from 'react'

interface Props {
  name: string
  label?: string
}

export const CustomDatePicker = ({ name, label }: Props) => {
  const { watch, setValue } = useFormContext()

  const dateValue = watch(name)

  // ------------------------------------------------------
  // FIX: INDIA TIMEZONE DATE
  // ------------------------------------------------------
  const getISTDate = () => {
    const now = new Date()
    return new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    )
  }

  const todayIST = getISTDate()
  const tomorrowIST = new Date(todayIST)
  tomorrowIST.setDate(tomorrowIST.getDate() + 1)

  // ------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------
  const format = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`

  // ------------------------------------------------------
  // DEFAULT VALUE (START = TODAY, END = TOMORROW)
  // ------------------------------------------------------
  useEffect(() => {
    if (!dateValue) {
      const defaultDate = name.toLowerCase().includes('end')
        ? tomorrowIST
        : todayIST

      setValue(name, format(defaultDate), { shouldValidate: true })
    }
  }, [dateValue, name, setValue, todayIST, tomorrowIST])

  // ------------------------------------------------------
  // PARSE CURRENT VALUE
  // ------------------------------------------------------
  const parseDate = (date: string | undefined) => {
    if (!date) return { day: '01', month: '01', year: '2010' }
    const [day, month, year] = date.split('/')
    return { day, month, year }
  }

  const current = parseDate(dateValue)

  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month, 0).getDate()

  // ------------------------------------------------------
  // DISABLE PAST DATE LOGIC (DAY & MONTH ONLY)
  // ------------------------------------------------------
  const isPastYear = (_year: string) => {
    // Allow all years from 2010–2050
    return false
  }

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
  const handleChange = (type: 'day' | 'month' | 'year', value: string) => {
    let { day, month, year } = current

    if (type === 'day') day = value
    if (type === 'month') month = value
    if (type === 'year') year = value

    const maxDays = getDaysInMonth(Number(month), Number(year))
    if (Number(day) > maxDays) {
      day = String(maxDays).padStart(2, '0')
    }

    setValue(name, `${day}/${month}/${year}`, { shouldValidate: true })
  }

  // ------------------------------------------------------
  // OPTIONS
  // ------------------------------------------------------
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // ✅ UPDATED YEAR RANGE (2010 → 2050)
  const START_YEAR = 2010
  const END_YEAR = 2050

  const years = Array.from(
    { length: END_YEAR - START_YEAR + 1 },
    (_, i) => String(START_YEAR + i)
  )

  const days = useMemo(() => {
    const max = getDaysInMonth(Number(current.month), Number(current.year))
    return Array.from({ length: max }, (_, i) =>
      String(i + 1).padStart(2, '0')
    )
  }, [current.month, current.year])

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label className="px-1">{label}</Label>}

      <div className="flex gap-2">
        {/* Month */}
        <Select
          value={current.month}
          onValueChange={(val) => handleChange('month', val)}
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
          value={current.day}
          onValueChange={(val) => handleChange('day', val)}
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
          value={current.year}
          onValueChange={(val) => handleChange('year', val)}
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
