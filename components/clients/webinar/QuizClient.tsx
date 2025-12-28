'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

import { fetcher } from '@/lib/fetcher'
import { apiRequest } from '@/lib/apiRequest'
import EntitySkeleton from '@/components/EntitySkeleton'
import AddQuizForm from '@/components/forms/webinar/AddQuizForm'

/* ================= TYPES ================= */

type QuizQuestion = {
  _id: string
  questionName: string
  options: string[]
  correctAnswer: string
}

type Quiz = {
  _id: string
  quizQuestions: QuizQuestion[]
  quizduration: string
}

/* ================= COMPONENT ================= */

export default function QuizClient({ webinarId }: { webinarId: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

  /* ================= FETCH ================= */

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/quizzes`,
    fetcher
  )

  const quizzes: Quiz[] = data?.data ?? []

  const activeQuiz = quizzes[activeIndex]

  /* ================= TABLE DATA ================= */

  const tableData = useMemo(() => activeQuiz?.quizQuestions ?? [], [activeQuiz])

  /* ================= ACTIONS ================= */

  const handleAdd = () => {
    setEditingQuiz(null)
    setSheetOpen(true)
  }

  const handleEdit = () => {
    setEditingQuiz(activeQuiz)
    setSheetOpen(true)
  }

  const handleDelete = async () => {
    if (!activeQuiz) return

    try {
      await apiRequest({
        endpoint: `/api/quizzes/${activeQuiz._id}`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Quiz deleted successfully',
      })

      toast.warning('Quiz deleted')
      setActiveIndex(0)
      await mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<QuizQuestion>[] = [
    {
      accessorKey: 'questionName',
      header: sortableHeader('Question'),
      cell: ({ row }) => (
        <p className="font-medium leading-snug">{row.original.questionName}</p>
      ),
    },
    {
      id: 'options',
      header: 'Options',
      cell: ({ row }) => (
        <ul className="list-disc pl-4 space-y-1 text-sm">
          {row.original.options.map((opt, i) => (
            <li key={i} className="text-muted-foreground">
              {opt}
            </li>
          ))}
        </ul>
      ),
    },
    {
      accessorKey: 'correctAnswer',
      header: 'Correct Answer',
      cell: ({ row }) => (
        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-sm font-medium">
          {row.original.correctAnswer}
        </span>
      ),
    },
  ]


  /* ================= UI STATES ================= */

  if (isLoading) return <EntitySkeleton title="Quiz" />
  if (error) return <p className="text-red-600">Failed to load quizzes.</p>

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Button
          onClick={handleAdd}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          + Add Quiz
        </Button>
      </div>

      {/* QUIZ TABS */}
      <div className="flex gap-3 overflow-x-auto border-b pb-2">
        {quizzes.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`px-4 py-2 text-sm rounded-t ${
              index === activeIndex
                ? 'border-b-2 border-orange-600 font-semibold text-orange-600'
                : 'text-muted-foreground'
            }`}
          >
            Quiz {index + 1}
          </button>
        ))}
      </div>

      {/* ACTION BAR */}
      {activeQuiz && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            Edit Quiz
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Delete Quiz
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this quiz.
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
        </div>
      )}

      {/* TABLE */}
      {tableData.length ? (
        <DataTable data={tableData} columns={columns} />
      ) : (
        <p className="text-muted-foreground">No questions in this quiz.</p>
      )}

      {/* SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[680px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingQuiz ? 'Edit Quiz' : 'Add Quiz'}
            </h2>
          </div>

          <AddQuizForm
            webinarId={webinarId}
            defaultValues={editingQuiz || undefined}
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
