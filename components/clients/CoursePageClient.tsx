'use client'

import { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import useSWR, { mutate } from 'swr'
import { CourseType } from '@/types/course'
import CardSkeleton from '@/components/CardSkeleton'
import AddCourseForm from '@/components/forms/AddCourseForm'
import CourseCard from '@/components/CourseCard'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const fetcher = (url: string) => fetch(url).then((res) => res.json())


const tabs = ['Active', 'Inactive', 'All'] as const

export default function CoursePageClient({
  initialCourses,
}: {
  initialCourses: CourseType[]
}) {
  const _URL = `${process.env.NEXT_PUBLIC_API_URL}/courses`
  const [open, setOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<CourseType | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  // ✅ Fetch courses
  const { data, isLoading } = useSWR(_URL, fetcher, {
    fallbackData: initialCourses,
  })

  const courses: CourseType[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : []

  // --- Filter by Tab ---
  const filteredByTab =
    activeTab === 'All'
      ? courses
      : courses.filter((course) => course.status === activeTab)

  // --- Filter by Course Type ---
  const filteredByType =
    selectedType === 'All'
      ? filteredByTab
      : filteredByTab.filter((course) => course.courseName === selectedType)

  // --- Search ---
  const filteredEvents = filteredByType.filter((event) =>
    (event.courseName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // --- Pagination ---
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // --- Handlers ---
  function handleAddEvent() {
    setCourseToEdit(null)
    setOpen(true)
  }

  function handleEditEvent(event: CourseType) {
    setCourseToEdit(event)
    setOpen(true)
  }

  async function handleSuccess() {
    await mutate(_URL)
    setOpen(false)
    setCourseToEdit(null)
  }

  return (
    <div className="p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">USI Courses</h1>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleAddEvent}
            >
              + Add Course
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[500px] sm:w-[600px]">
            <AddCourseForm
              onSuccess={handleSuccess}
              courseToEdit={courseToEdit}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-4 text-sm border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setCurrentPage(1)
            }}
            className={`pb-2 border-b-2 transition-colors duration-200 ${
              tab === activeTab
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Search */}
        <div className="relative w-full max-w-[320px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search webinars..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedEvents.map((event) => (
            <CourseCard
              key={event._id}
              event={event}
              onEdit={() => handleEditEvent(event)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh] border rounded">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-gray-600">No webinars match your criteria.</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
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
