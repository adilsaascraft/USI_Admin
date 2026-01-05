"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "@/components/ui/alert-dialog"
import AddSessionHallForm from "@/components/forms/conference/AddSessionHallForm"
import { DataTable } from "@/components/DataTable"
import { SessionHallValues } from "@/validations/hallSchema"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from "@/lib/fetcher"
import EntitySkeleton from "@/components/EntitySkeleton"
import { getIndianFormattedDate } from "@/lib/formatIndianDate"

export default function HallClient({ conferenceId }: { conferenceId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingHall, setEditingHall] = useState<
    (SessionHallValues & { _id?: string }) | null
  >(null)

  // Fetch Halls
  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/events/${conferenceId}/agenda-session-halls`,
    fetcher
  )

  const halls: (SessionHallValues & { _id: string })[] = useMemo(
    () => data?.data ?? [],
    [data]
  )

  // ✅ Add/Edit
  const handleAdd = () => {
    setEditingHall(null)
    setSheetOpen(true)
  }

  const handleEdit = (hall: SessionHallValues & { _id: string }) => {
    setEditingHall(hall)
    setSheetOpen(true)
  }

  // ✅ Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/event-admin/agenda-session-halls/${id}`,
        { method: "DELETE" }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Delete failed")

      toast.warning("Session Hall has deleted successfully!", {
        description: getIndianFormattedDate(),
      })

      mutate() // refresh list
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌")
    }
  }

  // ✅ Save callback (triggered by AddCategoryForm)
  const handleSave = async () => {
    setSheetOpen(false)
    setEditingHall(null)
    await mutate()
  }

  // ✅ Table columns
  const columns: ColumnDef<SessionHallValues & { _id: string }>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
      {
      accessorKey: "hallName",
      header: sortableHeader("Session Hall Name"),
      cell:({row}) => {
        return(
          <span className="text-extrabold font-medium">{row.original.hallName}</span>
        )
      }
    },
    {
  accessorKey: "status",
  header: sortableHeader("Status"),
  cell: ({ row }) => {
    const type = row.original.status;
    const isActive = type === "Active";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive ? "text-green-800 hover:text-green-900 bg-green-100 hover:bg-green-200"
           : "text-red-800 hover:text-red-900 bg-red-100 hover:bg-red-200"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  },
},
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)}>
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-sky-800 hover:bg-sky-900" size="sm">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. It will permanently delete{" "}
                  <span className="font-semibold">{row.original.hallName}</span>.
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
        </div>
      ),
    },
  ]

  // ✅ Loading / Error UI
  if (isLoading) return <EntitySkeleton title="Session Halls" />

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Session Hall Name</h1>
        <Button onClick={handleAdd} className="bg-orange-600 text-white hover:bg-orange-700">
          + Add Session Hall
        </Button>
      </div>

      {/* Table */}
      <DataTable data={halls} columns={columns} />

      {/* Sheet (Drawer) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingHall ? "Edit Session Hall" : "Add Session Hall"}
            </h2>
          </div>

          <AddSessionHallForm
            conferenceId={conferenceId}
            defaultValues={editingHall || undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// helper to DRY sortable column headers
function sortableHeader(label: string) {
  const HeaderComponent = ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button variant="ghost" onClick={() => column.toggleSorting(sorted === "asc")}>
        {label}
        {sorted === "asc" && <ArrowUp className="h-4 w-4 ml-2" />}
        {sorted === "desc" && <ArrowDown className="h-4 w-4 ml-2" />}
        {!sorted && <ArrowUpDown className="h-4 w-4 ml-2" />}
      </Button>
    )
  }

  HeaderComponent.displayName = `SortableHeader(${label})`
  return HeaderComponent
}
