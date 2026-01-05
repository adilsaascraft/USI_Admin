'use client'

import { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import useSWR, { mutate } from 'swr'
import { ConferenceType } from '@/types/conference'
import EventCardSkeleton from '@/components/CardSkeleton'
import AddConferenceForm from '@/components/forms/AddConferenceForm'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { conferenceType } from '@/lib/constants'
import ConferenceCard from '../ConferenceCard'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ConferencePageClient({
  initialConferences,
}: {
  initialConferences: ConferenceType[]
}) {
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/conferences`

  const [open, setOpen] = useState(false)
  const [conferenceToEdit, setConferenceToEdit] =
    useState<ConferenceType | null>(null)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  /* ================= FETCH ================= */

  const { data, isLoading } = useSWR(API_URL, fetcher, {
    fallbackData: initialConferences,
  })

  const conferences: ConferenceType[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : []

  /* ================= FILTER BY TYPE ================= */

  const filteredByType =
    selectedType === 'All'
      ? conferences
      : conferences.filter(
          (event) => event.conferenceType === selectedType
        )

  /* ================= SEARCH ================= */

  const filteredEvents = filteredByType.filter((event) =>
    (event.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  /* ================= HANDLERS ================= */

  function handleAddEvent() {
    setConferenceToEdit(null)
    setOpen(true)
  }

  function handleEditEvent(event: ConferenceType) {
    setConferenceToEdit(event)
    setOpen(true)
  }

  async function handleSuccess() {
    await mutate(API_URL)
    setOpen(false)
    setConferenceToEdit(null)
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Conferences</h1>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleAddEvent}
            >
              + Add Conference
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[500px] sm:w-[600px]">
            <AddConferenceForm
              onSuccess={handleSuccess}
              conferenceToEdit={conferenceToEdit}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Search */}
        <div className="relative w-full max-w-[320px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conferences..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-200"
          />
        </div>

        {/* Filter by Conference Type */}
        <Select
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Filter by Conference Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Conference Types</SelectItem>
            {conferenceType.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conference Cards */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedEvents.map((event) => (
            <ConferenceCard
              key={event._id}
              event={event}
              onEdit={() => handleEditEvent(event)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh] border rounded">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600">
              No conferences match your criteria.
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border transition ${
                currentPage === i + 1
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
