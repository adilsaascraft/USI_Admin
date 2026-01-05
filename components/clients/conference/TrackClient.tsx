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
import AddSessionTrackForm from "@/components/forms/conference/AddSessionTrackForm"
import { DataTable } from "@/components/DataTable"
import { SessionTrackValues } from "@/validations/trackSchema"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { fetchClient } from "@/lib/fetchClient"
import { fetcher } from "@/lib/fetcher"
import EntitySkeleton from "@/components/EntitySkeleton"
import { getIndianFormattedDate } from "@/lib/formatIndianDate"

/* ================= COMPONENT ================= */

export default function TrackClient({
  conferenceId,
}: {
  conferenceId: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<
    (SessionTrackValues & { _id?: string }) | null
  >(null)

  /* ================= FETCH ================= */

  const { data, isLoading, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/events/${conferenceId}/agenda-session-tracks`,
    fetcher
  )

  const tracks: (SessionTrackValues & { _id: string })[] = useMemo(
    () => data?.data ?? [],
    [data]
  )

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingTrack(null)
    setSheetOpen(true)
  }

  const handleEdit = (track: SessionTrackValues & { _id: string }) => {
    setEditingTrack(track)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/event-admin/agenda-session-tracks/${id}`,
        { method: "DELETE" }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Delete failed")

      toast.warning("Session Track deleted successfully!", {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌")
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingTrack(null)
    await mutate()
  }

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDef<SessionTrackValues & { _id: string }>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
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
      accessorKey: "trackName",
      header: sortableHeader("Session Track Name"),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.trackName}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: sortableHeader("Status"),
      cell: ({ row }) => {
        const isActive = row.original.status === "Active"
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? "text-green-800 bg-green-100 hover:bg-green-200"
                : "text-red-800 bg-red-100 hover:bg-red-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="bg-sky-800 hover:bg-sky-900"
                size="sm"
              >
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <span className="font-semibold">
                    {row.original.trackName}
                  </span>
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
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

  /* ================= STATES ================= */

  if (isLoading) return <EntitySkeleton title="Session Tracks" />

  /* ================= UI ================= */

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Session Tracks
        </h1>

        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Add Session Track
        </Button>
      </div>

      {/* Table */}
      <DataTable data={tracks} columns={columns} />

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingTrack
                ? "Edit Session Track"
                : "Add Session Track"}
            </h2>
          </div>

          <AddSessionTrackForm
            conferenceId={conferenceId}
            defaultValues={editingTrack || undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================= SORTABLE HEADER ================= */

function sortableHeader(label: string) {
  const HeaderComponent = ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(sorted === "asc")
        }
      >
        {label}
        {sorted === "asc" && (
          <ArrowUp className="h-4 w-4 ml-2" />
        )}
        {sorted === "desc" && (
          <ArrowDown className="h-4 w-4 ml-2" />
        )}
        {!sorted && (
          <ArrowUpDown className="h-4 w-4 ml-2" />
        )}
      </Button>
    )
  }

  HeaderComponent.displayName = `SortableHeader(${label})`
  return HeaderComponent
}
