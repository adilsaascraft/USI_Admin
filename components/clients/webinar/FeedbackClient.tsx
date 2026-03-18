'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
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
import { apiRequest } from '@/lib/apiRequest'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import AddFeedbackForm from '@/components/forms/webinar/AddFeedbackForm'
import { ChevronDown, ChevronRight, Download, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/* ================= TYPES ================= */

type ParticipantField = {
  label: string
  type: 'input' | 'checkbox'
  options: { label: string }[]
}

type FeedbackItem = {
  feedbackName: string
  parameterType: 'scale' | 'yes_no'
  options: string[]
}

type FeedbackSection = {
  feedbackLabelName: string
  feedbackItems: FeedbackItem[]
}

type OpenEndedItem = {
  label: string
}

type FeedbackDoc = {
  _id: string
  webinarId: string
  participantFields: ParticipantField[]
  feedbacks: FeedbackSection[]
  openEnded: OpenEndedItem[]
  closeNote?: string
  createdAt: string
  updatedAt: string
}

type FeedbackRow = {
  category: 'Participant' | 'Feedback' | 'Open Ended'
  section: string
  label: string
  parameterType: string
}

/* ================= COMPONENT ================= */

export default function FeedbackClient({ webinarId }: { webinarId: string }) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'by-user'>('feedback')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  /* ================= FETCH ADMIN FEEDBACK ================= */

  const {
    data: feedbackData,
    isLoading,
    mutate,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/feedback`,
    fetcher,
  )

  const feedbackDoc: FeedbackDoc | null = feedbackData?.data ?? null

  /* ================= FLATTEN DATA FOR TABLE ================= */

  const feedbackTableData = useMemo<FeedbackRow[]>(() => {
    if (!feedbackDoc) return []

    const rows: FeedbackRow[] = []

    feedbackDoc.participantFields.forEach((f) => {
      rows.push({
        category: 'Participant',
        section: '-',
        label: f.label,
        parameterType: f.type,
      })
    })

    feedbackDoc.feedbacks.forEach((section) => {
      section.feedbackItems.forEach((item) => {
        rows.push({
          category: 'Feedback',
          section: section.feedbackLabelName,
          label: item.feedbackName,
          parameterType: item.parameterType,
        })
      })
    })

    feedbackDoc.openEnded.forEach((q) => {
      rows.push({
        category: 'Open Ended',
        section: '-',
        label: q.label,
        parameterType: 'text',
      })
    })

    return rows
  }, [feedbackDoc])

  /* ================= FETCH FEEDBACK BY USER ================= */

  const { data: userFeedbackRes } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/public-feedback`,
    fetcher,
  )

  const feedbackCount = userFeedbackRes?.total ?? 0

  /* ================= FIXED TRANSFORM ================= */

  const userFeedbacks = useMemo(() => {
    if (!userFeedbackRes?.data) return []

    return userFeedbackRes.data.map((entry: any) => {
      const getField = (label: string) =>
        entry.participantAnswers?.find((a: any) =>
          a.label.toLowerCase().includes(label.toLowerCase()),
        )?.answer || '-'

      const name = getField('name')
      const city = getField('city')
      const designation = getField('designation')

      const answers =
        entry.sendFeedbacks?.flatMap((section: any) =>
          section.answers.map((a: any) => ({
            feedbackName: `${section.feedbackLabelName} - ${a.feedbackName}`,
            selectedOption: a.answer,
          })),
        ) || []

      const openEnded =
        entry.openEndedAnswers?.map((o: any) => ({
          feedbackName: o.label,
          selectedOption: o.answer || '-',
        })) || []

      const allAnswers = [...answers, ...openEnded]

      const ratings = answers
        .map((a: any) => Number(a.selectedOption))
        .filter((n: number) => !isNaN(n))

      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
          : null

      return {
        _id: entry._id,
        user: {
          name,
          email: city,
          mobile: designation,
          profilePicture: null,
        },
        answers: allAnswers,
        avgRating,
        otherFeedback: entry.sendOtherFeedback,
        createdAt: entry.createdAt,
      }
    })
  }, [userFeedbackRes])

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    await apiRequest({
      endpoint: `/api/webinars/${webinarId}/feedback`,
      method: 'DELETE',
      showToast: true,
      successMessage: 'Feedback deleted successfully',
    })
    await mutate()
  }

  /* ================= EXPAND ================= */

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    const rows = [
      [
        'Name',
        'City',
        'Designation',
        'Question',
        'Answer',
        'Avg Rating',
        'Submitted At',
      ].join(','),
    ]

    userFeedbacks.forEach((u: any) =>
      u.answers.forEach((a: any) => {
        rows.push(
          [
            u.user.name,
            u.user.email,
            u.user.mobile,
            `"${a.feedbackName}"`,
            `"${a.selectedOption}"`,
            u.avgRating || '',
            new Date(u.createdAt).toLocaleString(),
          ].join(','),
        )
      }),
    )

    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'feedback-by-user.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ================= TABLE COLUMNS ================= */

  const feedbackColumns: ColumnDef<FeedbackRow>[] = [
    {
      accessorKey: 'category',
      header: sortableHeader('Category'),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    { accessorKey: 'section', header: 'Section' },
    { accessorKey: 'label', header: 'Label / Parameter / Question' },
    {
      accessorKey: 'parameterType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.parameterType}</Badge>
      ),
    },
  ]

  const userColumns: ColumnDef<any>[] = [
    {
      header: 'User Details',
      cell: ({ row }) => {
        const u = row.original.user
        const open = expandedIds.includes(row.original._id)

        return (
          <div className="w-full">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleExpand(row.original._id)}>
                {open ? <ChevronDown /> : <ChevronRight />}
              </button>

              <Image
                src={u.profilePicture || '/avatar.png'}
                alt={u.name}
                width={40}
                height={40}
                className="rounded-full"
              />

              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">
                  {u.email} • {u.mobile}
                </p>

                {row.original.avgRating && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⭐ {row.original.avgRating}
                  </p>
                )}
              </div>
            </div>

            {open && (
              <div className="mt-3 ml-10 border-l pl-4 space-y-2">
                {row.original.answers.map((a: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{a.feedbackName}:</span>{' '}
                    {a.selectedOption}
                  </div>
                ))}

                {row.original.otherFeedback &&
                  row.original.otherFeedback !== 'Nil' && (
                    <div className="mt-2 text-sm text-orange-600">
                      <strong>Other:</strong> {row.original.otherFeedback}
                    </div>
                  )}
              </div>
            )}
          </div>
        )
      },
    },
  ]

  /* ================= UI ================= */

  if (isLoading) return <EntitySkeleton title="Feedback" />

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-6 border-b">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-2 ${
            activeTab === 'feedback'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500'
          }`}
        >
          Feedback
        </button>

        <button
          onClick={() => setActiveTab('by-user')}
          className={`pb-2 flex items-center gap-2 ${
            activeTab === 'by-user'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500'
          }`}
        >
          Feedback By User
          <Badge variant="secondary">{feedbackCount}</Badge>
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feedback</h2>

            <div className="flex gap-2">
              {feedbackDoc ? (
                <>
                  <Button variant="outline" onClick={() => setSheetOpen(true)}>
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-orange-600 text-white">
                        Delete
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove all feedback.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <Button onClick={() => setSheetOpen(true)}>
                  + Add Feedback
                </Button>
              )}
            </div>
          </div>

          <DataTable data={feedbackTableData} columns={feedbackColumns} />
        </>
      )}

      {/* Feedback By User */}
      {activeTab === 'by-user' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Submitted Feedback</h2>

            <Button variant="outline" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </Button>
          </div>

          <DataTable data={userFeedbacks} columns={userColumns} />
        </>
      )}

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[600px]">
          <AddFeedbackForm
            webinarId={webinarId}
            defaultValues={feedbackDoc ?? undefined}
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
  return ({ column }: any) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
