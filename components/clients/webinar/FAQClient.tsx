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
import AddQnAForm from '@/components/forms/webinar/AddQnAForm'
import { ArrowUpDown } from 'lucide-react'

/* ================= TYPES ================= */

type QnAItem = {
  question: string
  answer: string
}

type QnAResponse = {
  _id: string
  webinarId: string
  questionsAndAnswers: QnAItem[]
}

/* ================= COMPONENT ================= */

export default function QnAClient({ webinarId }: { webinarId: string }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  /* ================= FETCH ================= */

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/qna`,
    fetcher
  )

  const qnaDoc: QnAResponse | null = data?.data ?? null

  /* ================= TABLE DATA ================= */

  const tableData: QnAItem[] = useMemo(
    () => qnaDoc?.questionsAndAnswers ?? [],
    [qnaDoc]
  )

  /* ================= ACTIONS ================= */

  const handleEdit = () => {
    setSheetOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/qna`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Q&A deleted successfully',
      })

      toast.warning('Q&A deleted')
      await mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<QnAItem>[] = [
    {
      accessorKey: 'question',
      header: sortableHeader('Question'),
      cell: ({ row }) => (
        <p className="font-medium line-clamp-2">{row.original.question}</p>
      ),
    },
    {
      accessorKey: 'answer',
      header: 'Answer',
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {row.original.answer}
        </p>
      ),
    },
  ]

  /* ================= UI STATES ================= */

  if (isLoading) return <EntitySkeleton title="FAQ (Q&A)" />
  if (error) return <div className="text-red-600">Failed to load Q&A.</div>

  return (
    <div className="bg-background text-foreground">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">FAQ (Q&amp;A)</h1>

        <div className="flex gap-2">
          {qnaDoc && (
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
                    <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all questions and answers for
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

          {!qnaDoc && (
            <Button
              onClick={() => setSheetOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              + Add FAQ
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {tableData.length ? (
        <DataTable data={tableData} columns={columns} />
      ) : (
        <p className="text-muted-foreground">No FAQ added yet.</p>
      )}

      

      {/* SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[640px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {qnaDoc ? 'Edit FAQ' : 'Add FAQ'}
            </h2>
          </div>

          <AddQnAForm
            webinarId={webinarId}
            defaultValues={
              qnaDoc
                ? { questionsAndAnswers: qnaDoc.questionsAndAnswers }
                : undefined
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
