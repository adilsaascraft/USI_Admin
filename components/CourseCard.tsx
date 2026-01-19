'use client'
import { JSX, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseType } from "@/types/course"
import Image from 'next/image'
import { fetchClient } from "@/lib/fetchClient"
import { getIndianFormattedDate } from "@/lib/formatIndianDate"
import {
  Calendar,
  Pencil,
  Trash2,
  Clock3,
  History,
  FileText,
  Tag,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
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

type CourseCardProps = {
  event: CourseType
  onEdit: (event: CourseType) => void
}

export default function CourseCard({ event, onEdit }: CourseCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

 
  /* ================= HANDLERS ================= */
  const handleManage = () => {
    router.push(`/courses/${event._id}/weekcategory`)
  }

  // ✅ Delete  call
  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${event._id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete course')
      }

      toast('Course has been deleted', {
        description: getIndianFormattedDate(),
      })
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setDeleteOpen(false)
    }
  }

  return (
    <Card className="p-0 group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Course Image */}
      <div className="relative h-[250px] w-full overflow-hidden">
        <Image
          src={event.image}
          alt={event.courseName}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-fit transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <CardContent className="flex flex-col gap-3 p-4 text-sm">
        <h2 className="line-clamp-2 text-lg font-semibold text-sky-800">
          <button
            className="text-sky-800 hover:underline cursor-pointer"
            onClick={handleManage}
          >
            {event.courseName}
          </button>
        </h2>

        {/* Registration Type */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag size={16} />
          <span>
            <span className="font-medium">Registration:</span>{' '}
            {event.registrationType.charAt(0).toUpperCase() +
              event.registrationType.slice(1)}
          </span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={16} />
          <span>
            {event.startDate} {event.startTime} – {event.endDate}{' '}
            {event.endTime}
          </span>
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock3 size={16} />
          <span>Time Zone: {event.timeZone}</span>
        </div>
      </CardContent>

      {/* Manage Dropdown */}
      <div className="absolute right-3 top-65">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-lg bg-orange-600 px-3 py-1.5 text-white shadow hover:bg-orange-700"
            >
              Manage
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <>
              <DropdownMenuItem onClick={handleManage}>
                <FileText className="mr-2 h-4 w-4" />
                Manage Course
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this course?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-gray-600">
            This action cannot be undone. The course{' '}
            <span className="font-semibold">{event.courseName}</span> will be
            permanently removed.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
