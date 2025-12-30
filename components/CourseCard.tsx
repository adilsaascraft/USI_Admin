'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseType } from '@/types/course'
import Image from 'next/image'
import { fetchClient } from '@/lib/fetchClient'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import {
  Calendar,
  Pencil,
  Trash2,
  Clock3,
  FileText,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import clsx from 'clsx'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { mutate } from 'swr'



/* ================= PROPS ================= */
type CourseCardProps = {
  course: CourseType
  onEdit: (course: CourseType) => void
}

export default function CourseCard({ course, onEdit }: CourseCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  /* ================= STATUS MAP ================= */
  const statusMap = {
    Active: {
      label: 'Active',
      color: 'bg-green-100 text-green-700',
      icon: <CheckCircle className="h-4 w-4 mr-1" />,
    },
    Inactive: {
      label: 'Inactive',
      color: 'bg-red-100 text-red-700',
      icon: <XCircle className="h-4 w-4 mr-1" />,
    },
  } as const

  const currentStatus = statusMap[course.status]

  /* ================= HANDLERS ================= */
  const handleManage = () => {
    router.push(`/courses/${course._id}/weekcategory`)
  }
  // ✅ Delete API call
  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${course._id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete course')
      }

      toast('Course deleted successfully', {
        description: getIndianFormattedDate(),
      })

      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setDeleteOpen(false)
    }
  }

  /* ================= UI ================= */
  return (
    <Card className="p-0 group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Course Image */}
      <div className="relative h-[250px] w-full overflow-hidden">
        <Image
          src={course.courseImage}
          alt={course.courseName}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-fit transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Status Badge */}
      <span
        className={clsx(
          'absolute top-65 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur',
          currentStatus.color
        )}
      >
        {currentStatus.icon}
        {currentStatus.label}
      </span>

      {/* Content */}
      <CardContent className="flex flex-col gap-3 p-4 text-sm">
        <div className="flex items-center gap-3">
          <h2 className="line-clamp-2 text-lg font-semibold text-sky-800">
            {course.courseName}
          </h2>
        </div>

        {/* Registration Type */}
        <div className="flex items-center gap-1">
          <Tag size={16} />
          <span>
            Registration: {course.registrationType}
            {course.registrationType === 'paid' && ` (₹${course.amount})`}
          </span>
        </div>

        {/* Date / Time */}
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>
            {course.startDate} {course.startTime} – {course.endDate}{' '}
            {course.endTime}
          </span>
        </div>

        {/* Time Zone */}
        <div className="flex items-center gap-2">
          <Clock3 size={16} />
          <span>Time Zone: {course.timeZone}</span>
        </div>
      </CardContent>

      {/* Manage Menu */}
      <div className="absolute right-3 top-65">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Manage
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleManage}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Course
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(course)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Course
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this course?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-gray-600">
            This action cannot be undone.{' '}
            <span className="font-semibold">{course.courseName}</span> will be
            permanently removed.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
