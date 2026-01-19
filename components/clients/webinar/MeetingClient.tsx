'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import AddMeetingForm from '@/components/forms/webinar/AddMeetingForm'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= TYPES ================= */

export type Meeting = {
  _id: string
  webinarId: {
    _id: string
    name: string
  }
  meetingName: string
  meetingLink: string
  createdAt: string
}


/* ================= PAGE ================= */

export default function MeetingClient({ webinarId }: { webinarId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/meetings`,
    fetcher
  )

  const meetingList: Meeting[] = useMemo(() => {
    const list = data?.data ?? []

    return list.filter((m: Meeting) => {
      return m.webinarId?._id === webinarId
    })
  }, [data, webinarId])


  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingMeeting(null)
    setSheetOpen(true)
  }

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/meetings/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Delete failed')

      toast.success('Meeting deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingMeeting(null)
    await mutate()
  }

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDef<Meeting>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
    },

    {
      accessorKey: 'meetingName',
      header: sortableHeader('Meeting Name'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.meetingName}</span>
      ),
    },

    {
      accessorKey: 'meetingLink',
      header: 'Meeting Link',
      cell: ({ row }) => (
        <a
          href={row.original.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Open Link
        </a>
      ),
    },

    {
      accessorKey: 'createdAt',
      header: sortableHeader('Created On'),
      cell: ({ row }) => (
        <span>{getIndianFormattedDate(new Date(row.original.createdAt))}</span>
      ),
    },

    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {/* EDIT */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>

          {/* DELETE */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.meetingName}
                  </span>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDelete(row.original._id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  /* ================= STATES ================= */

  if (isLoading) return <EntitySkeleton title="Meetings" />

  if (error) return <div className="p-4 text-red-600">Failed to load data</div>

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Meetings</h1>

        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Add Meeting
        </Button>
      </div>

      <DataTable data={meetingList} columns={columns} />

      {/* Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingMeeting ? 'Edit Meeting' : 'Add Meeting'}
            </h2>
          </div>

          <AddMeetingForm
            webinarId={webinarId}
            defaultValues={editingMeeting ?? undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================= SORT HEADER ================= */

function sortableHeader(label: string) {
  return ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {label}
        {sorted === 'asc' && <ArrowUp className="h-4 w-4 ml-2" />}
        {sorted === 'desc' && <ArrowDown className="h-4 w-4 ml-2" />}
        {!sorted && <ArrowUpDown className="h-4 w-4 ml-2" />}
      </Button>
    )
  }
}
