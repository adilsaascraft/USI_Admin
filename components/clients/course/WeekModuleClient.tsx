'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
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
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import AddWeekModuleForm from '@/components/forms/course/AddWeekModule'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/* ================= TYPES ================= */

type ModuleRow = {
  _id: string
  topicName: string
  contentType: string
  weekCategoryName: string
  createdAt: string
}

/* ================= COMPONENT ================= */

export default function CourseModuleClient({ courseId }: { courseId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<any>(null)

  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}/weeks-with-modules`,
    fetcher
  )

  /* ================= FLATTEN DATA ================= */

  const moduleList: ModuleRow[] = useMemo(() => {
    if (!data?.data) return []

    return data.data.flatMap((week: any) =>
      week.modules.map((m: any) => ({
        ...m,
        weekCategoryName: week.weekCategoryName,
      }))
    )
  }, [data])

  /* ================= HANDLERS ================= */

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/modules/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Delete failed')

      toast.success('Module deleted successfully', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  const handleEdit = (row: ModuleRow) => {
    setEditingModule(row)
    setSheetOpen(true)
  }

  const handleAdd = () => {
    setEditingModule(null)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingModule(null)
    await mutate()
  }

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDef<ModuleRow>[] = [
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
      header: sortableHeader('Week'),
    },

    {
      accessorKey: 'topicName',
      header: sortableHeader('Topic'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.topicName}</span>
      ),
    },

    {
      accessorKey: 'contentType',
      header: sortableHeader('Type'),
      cell: ({ row }) => (
        <span className="capitalize">{row.original.contentType}</span>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>

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
                <AlertDialogTitle>Confirm delete?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.topicName}
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

  if (isLoading) return <EntitySkeleton title="Course Modules" />

  /* ================= UI ================= */

  return (
    <div className="bg-background text-foreground">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Course Modules</h1>

        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Add Module
        </Button>
      </div>

      <DataTable data={moduleList} columns={columns} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingModule ? 'Edit Module' : 'Add Module'}
            </h2>
          </div>

          <AddWeekModuleForm
            courseId={courseId}
            defaultValues={editingModule}
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
