'use client'

import { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import useSWR, { mutate } from 'swr'

import EventCardSkeleton from '@/components/EventCardSkeleton'
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

/* ================= TYPES ================= */
export interface CourseType {
  _id: string
  courseName: string
  courseImage: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeZone: string
  registrationType: 'paid' | 'free'
  amount: number
  status: 'Active' | 'Inactive'
  createdAt: string
}

/* ================= CONSTANTS ================= */
const fetcher = (url: string) => fetch(url).then((res) => res.json())
const statusTabs = ['All', 'Active', 'Inactive'] as const

export default function CoursePageClient({
  initialCourses,
}: {
  initialCourses: CourseType[]
}) {
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`

  const [open, setOpen] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<CourseType | null>(null)
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusTabs)[number]>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  /* ================= FETCH ================= */
  const { data, isLoading } = useSWR(API_URL, fetcher, {
    fallbackData: { data: initialCourses },
  })

  const courses: CourseType[] = Array.isArray(data?.data) ? data.data : []

  /* ================= FILTERS ================= */
  const filteredByStatus =
    activeStatus === 'All'
      ? courses
      : courses.filter((c) => c.status === activeStatus)

  const filteredCourses = filteredByStatus.filter((course) =>
    course.courseName.toLowerCase().includes(search.toLowerCase())
  )

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  /* ================= HANDLERS ================= */
  function handleAddCourse() {
    setCourseToEdit(null)
    setOpen(true)
  }

  function handleEditCourse(course: CourseType) {
    setCourseToEdit(course)
    setOpen(true)
  }

  async function handleSuccess() {
    await mutate(API_URL)
    setOpen(false)
    setCourseToEdit(null)
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Courses</h1>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleAddCourse}
            >
              + Add Course
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[500px] sm:w-[600px]">
            <AddCourseForm
              courseId={courseToEdit?._id || null}
              onSuccess={handleSuccess}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-6 mb-4 text-sm border-b border-gray-200">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveStatus(tab)
              setCurrentPage(1)
            }}
            className={`pb-2 border-b-2 transition-colors ${
              tab === activeStatus
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center mb-4">
        <div className="relative w-full max-w-[320px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="flex flex-col gap-4">
          {paginatedCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEdit={() => handleEditCourse(course)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh] border rounded">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
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
              className={`px-3 py-1 rounded border ${
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
