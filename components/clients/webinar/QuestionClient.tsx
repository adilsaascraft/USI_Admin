'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { fetcher } from '@/lib/fetcher'
import { fetchClient } from '@/lib/fetchClient'
import { useAuthStore } from '@/stores/authStore'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

/* ================= TYPES ================= */

type Question = {
  _id: string
  questionName: string
  createdAt: string
  userId: {
    _id: string
    name: string
    email?: string
    mobile?: string
    profilePicture?: string
  }
}

/* ================= UTILS ================= */

const formatDateTime = (date: string) => {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const ITEMS_PER_PAGE = 30

/* ================= COMPONENT ================= */

export default function QuestionClient({ webinarId }: { webinarId: string }) {
  
  const [page, setPage] = useState(1)

  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  /* ================= FETCH ================= */

  const { data, isLoading, error, mutate } = useSWR<{
    data: Question[]
  }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/questions`,
    fetcher
  )

  /* ================= SEARCH ================= */

  const filteredQuestions = useMemo(() => {
  const list = data?.data ?? []
  if (!search.trim()) return list

  const q = search.toLowerCase()

  return list.filter((item) => {
    return (
      item.questionName.toLowerCase().includes(q) ||
      item.userId?.name?.toLowerCase().includes(q) ||
      item.userId?.email?.toLowerCase().includes(q) ||
      item.userId?.mobile?.toLowerCase().includes(q)
    )
  })
}, [data, search])

const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)

const paginatedQuestions = useMemo(() => {
  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredQuestions.slice(start, end)
}, [filteredQuestions, page])

useEffect(() => {
  setPage(1)
}, [search])



  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/questions/${deleteId}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.success('Question deleted successfully')
      setDeleteId(null)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">Failed to load questions</div>
    )
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">
          All Questions Asked By Users
        </h2>

        <Input
          placeholder="Search by name, email, mobile or question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Cards */}
      {paginatedQuestions.length === 0 ? (
        <p className="text-muted-foreground">No questions found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {paginatedQuestions.map((q) => (

            <div
              key={q._id}
              className="relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Image
                    src={
                      q.userId?.profilePicture ||
                      '/avatar.png'
                    }
                    alt={q.userId?.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />

                  <div>
                    <p className="font-medium">
                      {q.userId?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {q.userId?.email || q.userId?.mobile}
                    </p>
                  </div>
                </div>

                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-2 hover:bg-muted">
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteId(q._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Question */}
              <div className="mt-4">
                <span className="font-semibold">Question:</span>{' '}
                {q.questionName}
              </div>

              {/* Time */}
              <div className="mt-2 text-sm text-muted-foreground">
                Time: {formatDateTime(q.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
  <div className="flex items-center justify-center gap-2 pt-6 flex-wrap">
    {/* Previous */}
    {page > 1 && (
      <button
        onClick={() => setPage((p) => p - 1)}
        className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
      >
        Previous
      </button>
    )}

    {/* Page Numbers */}
    {Array.from({ length: totalPages }).map((_, i) => {
      const pageNumber = i + 1

      // Always show first, last, current, and nearby pages
      if (
        pageNumber === 1 ||
        pageNumber === totalPages ||
        Math.abs(pageNumber - page) <= 1
      ) {
        return (
          <button
            key={pageNumber}
            onClick={() => setPage(pageNumber)}
            className={`rounded-md px-3 py-1 text-sm border ${
              page === pageNumber
                ? 'bg-primary text-white'
                : 'hover:bg-muted'
            }`}
          >
            {pageNumber}
          </button>
        )
      }

      // Ellipsis
      if (
        pageNumber === page - 2 ||
        pageNumber === page + 2
      ) {
        return (
          <span key={pageNumber} className="px-2 text-muted-foreground">
            ...
          </span>
        )
      }

      return null
    })}

    {/* Next */}
    <button
      disabled={page === totalPages}
      onClick={() => setPage((p) => p + 1)}
      className="rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
)}


      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this question?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
