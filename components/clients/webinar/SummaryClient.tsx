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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, CalendarDays, FileText } from 'lucide-react'
import { toast } from 'sonner'
import AddSummaryForm from '@/components/forms/webinar/AddSummaryForm'
import { fetchClient } from '@/lib/fetchClient'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import Image from 'next/image'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { FaRobot } from 'react-icons/fa'

/* ================= TYPES ================= */

export type SummaryItem = {
  _id: string
  webinarId: {
    _id: string
    name: string
    webinarType: string
    startDate?: string
    endDate?: string
    startTime?: string
    endTime?: string
    image?: string
  } | null
  summary: string // HTML from RichTextEditor
  createdAt: string
}

/* ================= PAGE ================= */

export default function SummaryClient({
  webinarId,
}: {
  webinarId: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItem, setEditingItem] =
    useState<SummaryItem | null>(null)

  const { data, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/summaries/${webinarId}`,
    fetcher
  )

  /* ================= SAFE DATA NORMALIZATION ================= */
  // Backend returns:
  // - 200 + object (when summary exists)
  // - 404 (handled by global fetcher -> data: null)

  const summaryItem: SummaryItem | null = useMemo(() => {
    const raw = data?.data ?? null

    // If backend sends single object (correct case)
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      if (raw?.webinarId?._id === webinarId) {
        return raw as SummaryItem
      }
    }

    return null
  }, [data, webinarId])

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    setEditingItem(null)
    setSheetOpen(true)
  }

  const handleEdit = (item: SummaryItem) => {
    setEditingItem(item)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/summaries/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Delete failed')

      toast.success('Summary deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong ❌')
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingItem(null)
    await mutate()
  }

  /* ================= STATES ================= */

  if (isLoading) return <EntitySkeleton title="Program Summary" />

  /* ================= EMPTY STATE ================= */

  if (!summaryItem) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Program AI Summary
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative w-64 h-48 mb-6">
            <Image
              src="/no.png"
              alt="No summary"
              fill
              className="object-contain"
            />
          </div>

          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <FileText size={18} />
            <span className="text-sm font-medium">
              No program summary available
            </span>
          </div>

          <p className="text-gray-400 text-sm max-w-md">
            Add an AI-generated summary for this webinar to help
            users quickly understand the program content.
          </p>

          <Button
            onClick={handleAdd}
            className="mt-6 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Add First Summary
          </Button>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-[500px] sm:w-[600px]">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit Summary' : 'Add Summary'}
              </h2>
            </div>

            <AddSummaryForm
              webinarId={webinarId}
              defaultValues={editingItem ?? undefined}
              onSave={handleSave}
            />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  /* ================= SINGLE FULL-WIDTH CARD UI ================= */

  const webinar = summaryItem.webinarId

  return (
    <div className="p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Program AI Summary
        </h1>
      </div>

      {/* FULL WIDTH CARD (Single Summary) */}
      {/* FULL WIDTH CARD (Single Summary with Internal Scroll) */}
<div className="w-full">
  <div className="relative rounded-2xl border bg-white shadow-md hover:shadow-xl transition flex flex-col h-[calc(100vh-140px)]">
    
    {/* 3 Dot Menu */}
    <div className="absolute top-6 right-6 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
          >
            <MoreVertical size={20} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleEdit(summaryItem)}
          >
            Edit
          </DropdownMenuItem>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete Summary?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will
                  permanently delete the program summary.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() =>
                    handleDelete(summaryItem._id)
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

    {/* ---------- FIXED HEADER SECTION ---------- */}
    <div className="p-8 pb-4 shrink-0">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-muted-foreground">
          {webinar?.name || 'Untitled Program'}
        </h2>

        <p className="text-md text-gray-500 mt-2">
          {webinar?.webinarType || 'Program'}
        </p>

        {(webinar?.startDate || webinar?.endDate) && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-3">
  <CalendarDays size={16} />

  <div className="flex flex-col leading-tight">
    {/* First Row - Date */}
    <span>
      {webinar?.startDate} – {webinar?.endDate}
    </span>

    {/* Second Row - Time */}
    <span>
      {webinar?.startTime} - {webinar?.endTime}
    </span>
  </div>
</div>

        )}
      </div>

      {/* Divider */}
      <div className="border-t my-6" />

      {/* Summary Heading */}
      <h3 className="font-semibold text-xl text-orange-700 flex items-center gap-2">
        <FaRobot size={20} />
        Program AI Summary
      </h3>
    </div>

    {/* ---------- SCROLLABLE CONTENT (KEY FIX) ---------- */}
    <div className="px-8 pb-8 overflow-y-auto flex-1">
      <div
         className="
    prose
    max-w-none
    prose-lg
    text-gray-700
    break-words
    [&_ol]:list-decimal
    [&_ul]:list-disc
    [&_ol]:pl-6
    [&_ul]:pl-6
    [&_li]:ml-1
  "
  dangerouslySetInnerHTML={{
    __html:
      summaryItem?.summary ||
      '<p>No summary available.</p>',
  }}
/>
    </div>
  </div>
</div>


      {/* Sheet Form */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingItem ? 'Edit Summary' : 'Add Summary'}
            </h2>
          </div>

          <AddSummaryForm
            webinarId={webinarId}
            defaultValues={editingItem ?? undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
