'use client'
import { useRouter } from 'next/navigation'
import { WebinarType } from "@/types/webinar"
import Image from 'next/image'
import { JSX, useState } from 'react'
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

type WebinarCardProps = {
  event: WebinarType
  onEdit: (event: WebinarType) => void
}

export default function WebinarCard({ event, onEdit }: WebinarCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Map status to color & icon
  const statusMap: Record<string, { color: string; icon: JSX.Element; label?: string }> = {
    Live: {
      color: "bg-green-100 text-green-700",
      icon: <Check className="h-5 w-5 mr-1" />,
    },
    Upcoming: {
      color: 'bg-blue-100 text-blue-700',
      icon: <Clock3 className="h-5 w-5 mr-1" />,
    },
    Past: {
      color: 'bg-orange-100 text-orange-700',
      icon: <History className="h-5 w-5 mr-1" />,
      label: 'Completed', // display "Completed" instead of Past
    },
  }

  const currentStatus = statusMap[event.dynamicStatus] || {
    color: 'bg-gray-100 text-gray-700',
    icon: <FileText className="h-5 w-5 mr-1" />,
    label: event.dynamicStatus,
  }

    const handleManage = () => {
      router.push(`/webinar/${event._id}/faculty`)
    }

  // ✅ Delete API call
  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinars/${event._id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete webinar')
      }

      toast("Webinar has been deleted", {
        description: getIndianFormattedDate(),
      })
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/webinars`)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setDeleteOpen(false)
    }
  }

  const displayStatus = currentStatus.label || event.dynamicStatus
  const isPast = event.dynamicStatus === 'Past'

  return (
    <Card className="p-0 group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Webinar Image */}
      <div className="relative h-[250px] w-full overflow-hidden">
        <Image
          src={event.image}
          alt={event.name}
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
        {displayStatus}
      </span>

      {/* Content */}
      <CardContent className="flex flex-col gap-3 p-4 text-sm">
        <h2 className="line-clamp-2 text-lg font-semibold text-sky-800">
          {event.name}
        </h2>

        {/* Registration Type */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag size={16} />
          <span>
            <span className="font-medium">Registration:</span>{' '}
            {event.registrationType}
          </span>
        </div>

        {/* Webinar Type */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag size={16} />
          <span>
            <span className="font-medium">Type:</span> {event.webinarType}
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
            {!isPast && (
              <>
                <DropdownMenuItem onClick={handleManage}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this webinar?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-gray-600">
            This action cannot be undone. The webinar{' '}
            <span className="font-semibold">{event.name}</span> will be
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
