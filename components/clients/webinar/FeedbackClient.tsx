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
import { Checkbox } from '@/components/ui/checkbox'

/* ================= TYPES ================= */

type FeedbackItem = {
  feedbackName: string
  options: string[]
}

type FeedbackResponse = {
  feedbacks: FeedbackItem[]
}

type UserFeedback = {
  _id: string
  user: {
    name: string
    email?: string
    mobile?: string
    profilePicture?: string
  }
  answers: {
    feedbackName: string
    selectedOption: string
  }[]
  otherFeedback?: string
  createdAt: string
}

/* ================= COMPONENT ================= */

export default function FeedbackClient({ webinarId }: { webinarId: string }) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'by-user'>('feedback')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  /* ================= FEEDBACK TEMPLATE ================= */

  const {
    data: feedbackData,
    isLoading,
    mutate,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/webinars/${webinarId}/feedback`,
    fetcher
  )

  const feedbackDoc: FeedbackResponse | null = feedbackData?.data ?? null

  const feedbackTableData = useMemo(
    () => feedbackDoc?.feedbacks ?? [],
    [feedbackDoc]
  )

  /* ================= FEEDBACK BY USER (NO LAZY LOAD) ================= */

  const { data: userFeedbackRes } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/webinars/${webinarId}/send-feedback`,
    fetcher
  )

  const feedbackCount = userFeedbackRes?.total ?? 0

  const userFeedbacks: UserFeedback[] = useMemo(() => {
    if (!userFeedbackRes?.data) return []

    return userFeedbackRes.data.map((entry: any) => ({
      _id: entry._id,
      user: {
        name: entry.userId.name ,
        email: entry.userId.email,
        mobile: entry.userId.mobile,
        profilePicture: entry.userId.profilePicture,
      },
      answers: entry.sendFeedbacks.map((f: any) => ({
        feedbackName: f.feedbackName,
        selectedOption: f.selectedOption,
      })),
      otherFeedback: entry.sendOtherFeedback,
      createdAt: entry.createdAt,
    }))
  }, [userFeedbackRes])

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    await apiRequest({
      endpoint: `/webinars/${webinarId}/feedback`,
      method: 'DELETE',
      showToast: true,
      successMessage: 'Feedback deleted successfully',
    })
    await mutate()
  }

  /* ================= TOGGLE EXPAND ================= */

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    const rows = [
      [
        'Name',
        'Email',
        'Mobile',
        'Question',
        'Answer',
        'Other Feedback',
        'Submitted At',
      ].join(','),
    ]

    userFeedbacks.forEach((u) =>
      u.answers.forEach((a) => {
        rows.push(
          [
            u.user.name,
            u.user.email || '',
            u.user.mobile || '',
            `"${a.feedbackName}"`,
            `"${a.selectedOption}"`,
            `"${u.otherFeedback || ''}"`,
            new Date(u.createdAt).toLocaleString(),
          ].join(',')
        )
      })
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

  /* ================= COLUMNS ================= */

  const feedbackColumns: ColumnDef<FeedbackItem>[] = [
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
      accessorKey: 'feedbackName',
      header: sortableHeader('Feedback Question'),
    },
    {
      accessorKey: 'options',
      header: 'Options',
      cell: ({ row }) => (
        <ul className="list-disc list-inside text-sm">
          {row.original.options.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      ),
    },
  ]

  const userColumns: ColumnDef<UserFeedback>[] = [
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
      header: 'User Details',
      cell: ({ row }) => {
        const u = row.original.user
        const open = expandedIds.includes(row.original._id)

        return (
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
                {u.email || u.mobile}
              </p>
            </div>
          </div>
        )
      },
    },
  ]

  /* ================= UI ================= */

  if (isLoading) return <EntitySkeleton title="Feedback" />

  return (
    <div className="space-y-4">
      {/* TABS */}
      <div className="flex gap-6 border-b">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-2 transition-colors ${
            activeTab === 'feedback'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500'
          }`}
        >
          Feedback
        </button>

        <button
          onClick={() => setActiveTab('by-user')}
          className={`pb-2 flex items-center gap-2 transition-colors ${
            activeTab === 'by-user'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500'
          }`}
        >
          Feedback By User
          <Badge variant="secondary">{feedbackCount}</Badge>
        </button>
      </div>

      {/* FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feedback</h2>

            <div className="flex gap-2">
              {feedbackDoc && (
                <>
                  <Button variant="outline" onClick={() => setSheetOpen(true)}>
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-600 text-white">Delete</Button>
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
                        <AlertDialogAction
                          className="bg-red-600 text-white"
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
                  className="bg-orange-600 text-white"
                >
                  + Add Feedback
                </Button>
              )}
            </div>
          </div>

          {feedbackTableData.length ? (
            <DataTable data={feedbackTableData} columns={feedbackColumns} />
          ) : (
            <p className="text-muted-foreground">No feedback configured yet.</p>
          )}
        </>
      )}

      {/* FEEDBACK BY USER TAB */}
      {activeTab === 'by-user' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Submitted Feedback</h2>

            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download size={16} />
              Export CSV
            </Button>
          </div>

          <DataTable data={userFeedbacks} columns={userColumns} />

          {userFeedbacks.map(
            (u) =>
              expandedIds.includes(u._id) && (
                <div key={u._id} className="ml-10 space-y-2">
                  {u.answers.map((a, i) => (
                    <div key={i} className="rounded border p-3">
                      <p className="font-medium">{a.feedbackName}</p>
                      <p className="text-primary">{a.selectedOption}</p>
                    </div>
                  ))}

                  {u.otherFeedback && (
                    <div className="bg-muted p-3 rounded text-sm">
                      <strong>Other Feedback:</strong> {u.otherFeedback}
                    </div>
                  )}
                </div>
              )
          )}
        </>
      )}

      {/* SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[640px]">
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
