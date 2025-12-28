'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
import { toast } from 'sonner'
import { apiRequest } from '@/lib/apiRequest'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import AddFeedbackForm from '@/components/forms/webinar/AddFeedbackForm'
import { ArrowUpDown } from 'lucide-react'

/* ================= TYPES ================= */

type FeedbackItem = {
  feedbackName: string
  options: string[]
}

type FeedbackResponse = {
  _id: string
  webinarId: string
  feedbacks: FeedbackItem[]
}

/* ================= COMPONENT ================= */

export default function FeedbackClient({ webinarId }: { webinarId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  /* ================= FETCH ================= */

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/feedback`,
    fetcher
  )

  const feedbackDoc: FeedbackResponse | null = data?.data ?? null

  /* ================= TABLE DATA ================= */

  const tableData: FeedbackItem[] = useMemo(
    () => feedbackDoc?.feedbacks ?? [],
    [feedbackDoc]
  )

  /* ================= ACTIONS ================= */

  const handleEdit = () => setSheetOpen(true)

  const handleDelete = async () => {
    try {
      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/feedback`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Feedback deleted successfully',
      })

      toast.warning('Feedback deleted')
      await mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<FeedbackItem>[] = [
    {
      accessorKey: 'feedbackName',
      header: sortableHeader('Feedback Question'),
      cell: ({ row }) => (
        <p className="font-medium">{row.original.feedbackName}</p>
      ),
    },
    {
      accessorKey: 'options',
      header: 'Options',
      cell: ({ row }) => (
        <ul className="list-disc list-inside text-sm text-muted-foreground">
          {row.original.options.map((opt, i) => (
            <li key={i}>{opt}</li>
          ))}
        </ul>
      ),
    },
  ]

  /* ================= UI STATES ================= */

  if (isLoading) return <EntitySkeleton title="Feedback" />
  if (error) return <div className="text-red-600">Failed to load feedback.</div>

  return (
    <div className="bg-background text-foreground">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Feedback</h1>

        <div className="flex gap-2">
          {feedbackDoc && (
            <>
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all feedback questions for
                      this webinar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDelete}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {!feedbackDoc && (
            <Button
              onClick={() => setSheetOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              + Add Feedback
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {tableData.length ? (
        <DataTable data={tableData} columns={columns} />
      ) : (
        <p className="text-muted-foreground">No feedback configured yet.</p>
      )}

      {/* SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[640px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {feedbackDoc ? 'Edit Feedback' : 'Add Feedback'}
            </h2>
          </div>

          <AddFeedbackForm
            webinarId={webinarId}
            defaultValues={
              feedbackDoc ? { feedbacks: feedbackDoc.feedbacks } : undefined
            }
            onSave={async () => {
              await mutate()
              setSheetOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================= SORT HEADER ================= */

function sortableHeader(label: string) {
  const Header = ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {label}
        <ArrowUpDown className="h-4 w-4 ml-2" />
      </Button>
    )
  }

  Header.displayName = `SortableHeader(${label})`
  return Header
}
