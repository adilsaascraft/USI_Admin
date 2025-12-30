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

import AddWeekCategoryForm from '@/components/forms/course/AddWeekCategoryForm'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= TYPES ================= */

export type WeekCategory = {
  _id: string
  weekCategoryName: string
  status: 'Active' | 'Inactive'
  createdAt: string
}

/* ================= PAGE ================= */

export default function WeekCategoryClient({ courseId }: { courseId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingWeek, setEditingWeek] = useState<WeekCategory | null>(null)

  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/week-categories`,
    fetcher
  )

  const weekList: WeekCategory[] = useMemo(
    () => data?.data ?? [],
    [data]
  )

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingWeek(null)
    setSheetOpen(true)
  }

  const handleEdit = (week: WeekCategory) => {
    setEditingWeek(week)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/week-categories/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Delete failed')

      toast.success('Week category deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingWeek(null)
    await mutate()
  }

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDef<WeekCategory>[] = [
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
      accessorKey: 'weekCategoryName',
      header: sortableHeader('Week Name'),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.weekCategoryName}
        </span>
      ),
    },

    {
      accessorKey: 'status',
      header: sortableHeader('Status'),
    },

    {
      accessorKey: 'createdAt',
      header: sortableHeader('Created On'),
      cell: ({ row }) => (
        <span>
          {getIndianFormattedDate(new Date(row.original.createdAt))}
        </span>
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
              <Button size="sm" variant="destructive" className='bg-orange-600 hover:bg-orange-700'>
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.weekCategoryName}
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

  if (isLoading) return <EntitySkeleton title="Week Categories" />

  if (error)
    return <div className="p-4 text-red-600">Failed to load data</div>

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Week Categories</h1>

        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Add Week
        </Button>
      </div>

      <DataTable data={weekList} columns={columns} />

      {/* Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingWeek ? 'Edit Week Category' : 'Add Week Category'}
            </h2>
          </div>

          <AddWeekCategoryForm
            courseId={courseId}
            defaultValues={editingWeek ?? undefined}
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
