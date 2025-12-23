'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
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

/* ================= TYPES ================= */
export type CourseType = {
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
}

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
    router.push(`/courses/${course._id}`)
  }

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
    <Card className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 relative shadow-sm">
      {/* Course Image */}
      <div className="w-[300px] h-[250px] relative">
        <Image
          src={course.courseImage}
          alt={course.courseName}
          fill
          sizes="(max-width: 300px) 100vw, 300px"
          className="object-cover rounded-md"
        />
      </div>

      {/* Content */}
      <CardContent className="flex-1 w-full p-0 space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-sky-800 dark:text-foreground">
            {course.courseName}
          </h2>

          <span
            className={clsx(
              'inline-flex items-center text-xs font-semibold px-2 py-1 rounded',
              currentStatus.color
            )}
          >
            {currentStatus.icon}
            {currentStatus.label}
          </span>
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
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Manage
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleManage}>
              <FileText className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(course)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
