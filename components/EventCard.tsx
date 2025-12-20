'use client'
import { EventType } from "@/types/webinar"
import Image from 'next/image'
import { JSX, useState } from 'react'
import { fetchClient } from "@/lib/fetchClient"
import { getIndianFormattedDate } from "@/lib/formatIndianDate"
import {
  Calendar,
  MapPin,
  Map as MapIcon,
  Pencil,
  Trash2,
  Clock3,
  Ban,
  History,
  FileText,
  Users,
  Building2,
  Tag,
  Layers,
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

type EventCardProps = {
  event: EventType
  onEdit: (event: EventType) => void
}

export default function EventCard({ event, onEdit }: EventCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Map status to color & icon
  const statusMap: Record<string, { color: string; icon: JSX.Element; label?: string }> = {
    Live: {
      color: "bg-green-100 text-green-700",
      icon: <Check className="h-5 w-5 mr-1" />,
    },
    Running: {
      color: 'bg-blue-100 text-blue-700',
      icon: <Clock3 className="h-5 w-5 mr-1" />,
    },
    Cancelled: {
      color: 'bg-red-100 text-red-700',
      icon: <Ban className="h-5 w-5 mr-1" />,
    },
    Past: {
      color: 'bg-orange-100 text-orange-700',
      icon: <History className="h-5 w-5 mr-1" />,
      label: 'Completed', // display "Completed" instead of Past
    },
    Draft: {
      color: 'bg-orange-100 text-orange-700',
      icon: <FileText className="h-5 w-5 mr-1" />,
    },
  }

  const currentStatus = statusMap[event.dynamicStatus] || {
    color: 'bg-gray-100 text-gray-700',
    icon: <FileText className="h-5 w-5 mr-1" />,
    label: event.dynamicStatus,
  }

  // ✅ Delete API call
  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${event._id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete event')
      }

      toast("Event has been deleted", {
        description: getIndianFormattedDate(),
      })
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/events`)
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
    <Card className="flex flex-col md:flex-row items-start md:items-center p-4 gap-4 relative shadow-sm">
      {/* Event Image */}
      <div className="w-[150px] h-[200px] relative">
        <Image
          src={event.eventImage}
          alt={event.eventName}
          fill
          sizes="(max-width: 150px) 100vw, 200px"
          className="object-cover rounded-md"
        />
      </div>

      {/* Content */}
      <CardContent className="flex-1 w-full p-0 space-y-2 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-sky-800 dark:text-foreground">{event.eventName}</h2>
          <span className={clsx("inline-flex items-center text-xs font-semibold px-2 py-1 rounded", currentStatus.color)}>
            {currentStatus.icon}
            {displayStatus}
          </span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2">
          <MapIcon size={16} />
          <span>{event.venueName?.venueName}</span>
        </div>

        {/* Type + Category */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Tag size={16} />
            <span>{event.eventType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers size={16} />
            <span>{event.eventCategory}</span>
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>
            {event.startDate} {event.startTime} - {event.endDate} {event.endTime}
          </span>
        </div>

        {/* Organizer + Department */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{event.organizer?.organizerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 size={16} />
            <span>{event.department?.departmentName}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>
            {[event.city, event.state, event.country].filter(Boolean).join(", ")}
          </span>
        </div>
      </CardContent>

      {/* Dropdown Menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-sky-800 hover:bg-sky-900 text-white px-4 py-2 rounded-lg">
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {!isPast && (
              <>
                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem> */}
                {/* <DropdownMenuItem asChild>
                  <a
                    href={'#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Registration Link
                  </a>
                </DropdownMenuItem> */}
              </>
            )}
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* AlertDialog for Delete */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this event?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            This action cannot be undone. The event{' '}
            <span className="font-semibold">{event.eventName}</span> will be
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
