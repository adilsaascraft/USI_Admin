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

import AddFacultyForm from '@/components/forms/webinar/AddFacultyForm'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= TYPES ================= */

type AssignedFaculty = {
  _id: string
  facultyType: string
  createdAt: string
  speakerId: {
    _id: string
    speakerName: string
  }
}

/* ================= PAGE ================= */

export default function FacultyClient({ webinarId }: { webinarId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  // ✅ Assigned faculty list
  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/assign-speakers/${webinarId}`,
    fetcher
  )

  const facultyList: AssignedFaculty[] = useMemo(() => data?.data ?? [], [data])

  // ✅ Add new
  const handleAdd = () => {
    setSheetOpen(true)
  }

  // ✅ Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/assign-speakers/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Delete failed')

      toast.warning('Assigned faculty deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  // ✅ Save callback after assign
  const handleSave = async () => {
    setSheetOpen(false)
    await mutate()
  }

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDef<AssignedFaculty>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: 'speakerId.speakerName',
      header: sortableHeader('Speaker Name'),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.speakerId?.speakerName}
        </span>
      ),
    },

    {
      accessorKey: 'facultyType',
      header: sortableHeader('Faculty Type'),
      cell: ({ row }) => <span>{row.original.facultyType}</span>,
    },

    {
  accessorKey: 'createdAt',
  header: sortableHeader('Assigned On'),
  cell: ({ row }) => (
    <span>
      {getIndianFormattedDate(new Date(row.original.createdAt))}
    </span>
  ),
}
,

    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Delete
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{' '}
                <span className="font-semibold">
                  {row.original.speakerId?.speakerName}
                </span>{' '}
                from this webinar.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(row.original._id)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]

  /* ================= STATES ================= */

  if (isLoading) return <EntitySkeleton title="Assigned Speakers" />

  if (error)
    return (
      <div className="p-4 text-red-600">Failed to load assigned speakers</div>
    )

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Assigned Faculty</h1>

        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Assign Faculty
        </Button>
      </div>

      {/* Table */}
      <DataTable data={facultyList} columns={columns} />

      {/* Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Assign Faculty</h2>
          </div>

          <AddFacultyForm webinarId={webinarId} onSave={handleSave} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================= SORT HEADER ================= */

function sortableHeader(label: string) {
  const HeaderComponent = ({ column }: any) => {
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
  HeaderComponent.displayName = `SortableHeader(${label})`
  return HeaderComponent
}
