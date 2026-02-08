'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  RefreshCcw,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

import RichTextEditor from '@/components/RichTextEditor'


const statusStyles: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700 border border-red-200",
  RESOLVED: "bg-green-100 text-green-700 border border-green-200",
};


/* ================= TYPES ================= */

type SupportMessage = {
  _id: string
  name: string
  email: string
  message: string
  supportTicketNumber?: string
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
}

type ApiResponse = {
  message: string
  count: number
  data: SupportMessage[]
}

type SortOrder = 'newest' | 'oldest'
type StatusFilter = 'ALL' | 'OPEN' | 'RESOLVED'

/* ================= UTILS ================= */

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

const ITEMS_PER_PAGE = 30

/* ================= PAGE ================= */

const ReplySchema = z.object({
  description: z.string().min(1, 'Reply message is required'),
})

type ReplyValues = z.infer<typeof ReplySchema>


export default function Page() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')
  const [replyText, setReplyText] = useState('')
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null)
  const [isReplySubmitting, setIsReplySubmitting] = useState(false)


  const form = useForm<ReplyValues>({
    resolver: zodResolver(ReplySchema),
    defaultValues: {
      description: '',
    },
  })



  /* ================= FETCH ================= */

  const fetchUrl = useMemo(() => {
    const base = `${process.env.NEXT_PUBLIC_API_URL}/api/support-message`
    if (statusFilter === 'ALL') return base
    return `${base}?status=${statusFilter}`
  }, [statusFilter])

  const { data, isLoading, error, mutate, isValidating } =
    useSWR<ApiResponse>(
      ['support-messages', statusFilter],
      async () => {
        const res = await fetch(fetchUrl)
        if (!res.ok) throw new Error('Failed to fetch support messages')
        return res.json()
      }
    )

  /* ================= ACTIONS ================= */

  const handleReplySubmit = async (values: ReplyValues) => {
    if (!replyTicketId || isReplySubmitting) return

    setIsReplySubmitting(true)

    try {
      await apiRequest({
        endpoint: `/api/support-message/${replyTicketId}/reply`,
        method: 'POST',
        body: {
          replyMessage: values.description,
        },
        showToast: true,
        successMessage: 'Reply sent successfully',
      })

      form.reset()
      setReplyTicketId(null)
      mutate()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsReplySubmitting(false)
    }
  }




  const deleteTicket = async (id: string) => {
    try {
      await apiRequest({
        endpoint: `/api/support-message/${id}`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Ticket deleted successfully',
      })
      mutate()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  /* ================= MEMOIZED ================= */

  const filteredAndSortedMessages = useMemo(() => {
    let list = data?.data ?? []

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q) ||
          i.supportTicketNumber?.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) =>
      sortOrder === 'newest'
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(a.createdAt) - +new Date(b.createdAt)
    )
  }, [data, search, sortOrder])

  const totalPages = Math.ceil(
    filteredAndSortedMessages.length / ITEMS_PER_PAGE
  )

  const paginatedMessages = filteredAndSortedMessages.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  useEffect(() => setPage(1), [search, sortOrder, statusFilter])

  /* ================= STATES ================= */

  if (isLoading)
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    )

  if (error)
    return (
      <div className="p-4 text-center text-red-600">
        Failed to load support tickets
      </div>
    )

  /* ================= RENDER ================= */

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-sky-800">
          Technical Support Tickets
        </h2>
        <p className="text-muted-foreground">
          Manage user support queries
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-between gap-3">
        <Input
          placeholder="Search name, email, ticket or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div className="flex gap-2 items-center">
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as StatusFilter)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(v) =>
              setSortOrder(v as SortOrder)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => mutate()}
            disabled={isValidating}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''
                }`}
            />
          </Button>
        </div>
      </div>

      {/* Cards */}
      {paginatedMessages.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No support tickets found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedMessages.map((item) => (
            <div
              key={item._id}
              className="relative rounded-xl border p-5 bg-card shadow-sm"
            >
              {/* 3-dot menu */}
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {item.status === 'OPEN' && (
                      <AlertDialog
                        open={replyTicketId === item._id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setReplyTicketId(null)
                            setReplyText('')
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              setReplyTicketId(item._id)
                            }}
                          >
                            Reply
                          </DropdownMenuItem>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="w-full max-w-lg sm:max-w-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reply to Ticket</AlertDialogTitle>
                          </AlertDialogHeader>

                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit(handleReplySubmit)}
                              className="flex flex-col gap-4"
                            >
                              {/* Editor Area */}
                              <div className="max-h-[60vh] overflow-y-auto pr-1">
                                <FormField
                                  control={form.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Reply Message</FormLabel>
                                      <FormControl>
                                        <RichTextEditor
                                          value={field.value || ''}
                                          onChange={field.onChange}
                                          placeholder="Write your reply..."
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Footer – always outside editor */}
                              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-3 border-t">
                                <AlertDialogCancel
                                  type="button"
                                  disabled={isReplySubmitting}
                                  onClick={() => {
                                    form.reset()
                                    setReplyTicketId(null)
                                  }}
                                >
                                  Cancel
                                </AlertDialogCancel>

                                <Button
                                  type="submit"
                                  disabled={isReplySubmitting}
                                  className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                                >
                                  {isReplySubmitting ? 'Sending...' : 'Send Reply'}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </AlertDialogContent>

                      </AlertDialog>
                    )}


                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) =>
                            e.preventDefault()
                          }
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this support ticket?
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() =>
                              deleteTicket(item._id)
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card content */}
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.email}
              </p>

              {item.supportTicketNumber && (
                <p className="text-xs mt-1 text-muted-foreground">
                  Ticket: {item.supportTicketNumber}
                </p>
              )}

              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[item.status] || "bg-gray-100 text-gray-700"
                    }`}
                >
                  Status: {item.status === "OPEN" ? "Open" : "Resolved"}
                </span>
              </div>


              <p className="mt-4 text-sm whitespace-pre-line">
                {item.message}
              </p>

              <p className="mt-3 text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
