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
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

import AddSessionForm from '@/components/forms/conference/AddSessionForm'
import { DataTable } from '@/components/DataTable'
import { fetcher } from '@/lib/fetcher'
import { fetchClient } from '@/lib/fetchClient'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { SessionValues } from '@/validations/sessionSchema'

/* ================= TYPES ================= */

type SessionApiRow = {
  _id: string
  conferenceId: { _id: string }
  sessionName: string
  sessionDate: string
  hallId: { _id: string; hallName: string }
  trackId: { _id: string; trackName: string }
  startTime: string
  endTime: string

  // ✅ NEW
  chairperson: {
    _id: string
    prefix: string
    speakerName: string
  }[]
}


/* ================= COMPONENT ================= */

export default function SessionClient({
  conferenceId,
}: {
  conferenceId: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<
    (SessionValues & { _id?: string }) | null
  >(null)

  /* ================= FETCH ================= */

  const { data, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/conferences/${conferenceId}/sessions`,
    fetcher
  )

  const sessions: SessionApiRow[] = useMemo(() => data?.data ?? [], [data])

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingSession(null)
    setSheetOpen(true)
  }

  const handleEdit = (session: SessionApiRow) => {
  setEditingSession({
    _id: session._id,
    conferenceId: session.conferenceId._id,
    sessionName: session.sessionName,
    sessionDate: session.sessionDate,
    hallId: session.hallId._id,
    trackId: session.trackId._id,
    startTime: session.startTime,
    endTime: session.endTime,

    // ✅ IMPORTANT FIX
    chairperson: session.chairperson?.map((c) => c._id) ?? [],
  })

  setSheetOpen(true)
}


  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.warning('Session deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingSession(null)
    await mutate()
  }

  /* ================= TABLE ================= */

  const columns: ColumnDef<SessionApiRow>[] = [
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
      accessorKey: 'sessionName',
      header: sortableHeader('Session Name'),
    },
    {
  id: 'chairperson',
  header: sortableHeader('Chairperson'),
  cell: ({ row }) => {
    const chairpersons = row.original.chairperson || []

    if (!chairpersons.length) {
      return <span className="text-muted-foreground">—</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {chairpersons.map((c) => (
          <span
            key={c._id}
            className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium"
          >
            {c.prefix} {c.speakerName}
          </span>
        ))}
      </div>
    )
  },
},

    {
      id: 'hall',
      header: sortableHeader('Hall'),
      cell: ({ row }) => row.original.hallId.hallName,
    },
    {
      id: 'track',
      header: sortableHeader('Track'),
      cell: ({ row }) => row.original.trackId.trackName,
    },
    {
      accessorKey: 'sessionDate',
      header: sortableHeader('Date'),
    },
    {
      accessorKey: 'startTime',
      header: sortableHeader('Start Time'),
    },
    {
      accessorKey: 'endTime',
      header: sortableHeader('End Time'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.sessionName}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDelete(row.original._id)}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (isLoading) return <EntitySkeleton title="Sessions" />

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleAdd}>
          + Add Session
        </Button>
      </div>

      <DataTable data={sessions} columns={columns} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[600px]">
          <AddSessionForm
            conferenceId={conferenceId}
            defaultValues={editingSession || undefined}
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
        {sorted === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
        {sorted === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
        {!sorted && <ArrowUpDown className="ml-2 h-4 w-4" />}
      </Button>
    )
  }
}
