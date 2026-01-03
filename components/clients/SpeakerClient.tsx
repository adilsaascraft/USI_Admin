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
import AddSpeakerForm from '@/components/forms/AddSpeakerForm'
import { DataTable } from '@/components/DataTable'
import { SpeakerFormValues } from '@/validations/speakerSchema'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { fetcher } from '@/lib/fetcher'
import { apiRequest } from '@/lib/apiRequest'
import EntitySkeleton from '../EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

type Tab = 'Active' | 'Inactive' | 'All'

export default function SpeakerClient() {
  const [activeTab, setActiveTab] = useState<Tab>('Active')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState<
    (SpeakerFormValues & { _id?: string }) | null
  >(null)

  // 🔑 Fetch speakers
  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/speakers`,
    fetcher
  )

  const speakers: (SpeakerFormValues & { _id: string })[] = useMemo(
    () => data?.data ?? [],
    [data]
  )

  // Open add
  const handleAdd = () => {
    setEditingSpeaker(null)
    setSheetOpen(true)
  }

  // Open edit
  const handleEdit = (speaker: SpeakerFormValues & { _id: string }) => {
    setEditingSpeaker(speaker)
    setSheetOpen(true)
  }

  // Save callback
  const handleSave = async (formData: SpeakerFormValues & { _id?: string }) => {
    try {
      await mutate()
      setSheetOpen(false)
      setEditingSpeaker(null)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await apiRequest({
        endpoint: `/api/admin/speakers/${id}`,
        method: 'DELETE',
        showToast: true,
        successMessage: 'Speaker deleted successfully',
      })

      toast.warning('Speaker deleted!', {
        description: getIndianFormattedDate(),
      })

      await mutate()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Columns
  const columns: ColumnDef<SpeakerFormValues & { _id: string }>[] = [
    {
      accessorFn: (row) => `${row.prefix} ${row.speakerName}`,
      id: 'speakerName',
      header: sortableHeader('Speaker Name'),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.prefix} {row.original.speakerName}
        </span>
      ),
    },
    
    {
      accessorKey: 'specialization',
      header: sortableHeader('Specialization'),
    },
    
    {
      accessorKey: 'affiliation',
      header: sortableHeader('Affiliation'),
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <span>
          {[row.original.country, row.original.state, row.original.city]
            .filter(Boolean)
            .join(', ')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: sortableHeader('Status'),
    },
    {
      id: 'actions',
      header: 'Actions',
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
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Speaker?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. It will permanently delete{' '}
                  <span className="font-semibold">
                    {row.original.prefix} {row.original.speakerName}
                  </span>
                  .
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

  // Filter by tab
  const filteredSpeakers = useMemo(() => {
    if (activeTab === 'All') return speakers
    return speakers.filter((s) => s.status === activeTab)
  }, [activeTab, speakers])

  // UI states
  if (isLoading) return <EntitySkeleton title="Speakers" />
  if (error) return <div className="text-red-600">Failed to load speakers.</div>

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Speakers</h1>
        <Button
          onClick={handleAdd}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          + Add Speaker
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-4 text-sm text-gray-600 border-b">
        {(['Active', 'Inactive', 'All'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 ${
              tab === activeTab
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable data={filteredSpeakers} columns={columns} />

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[520px] sm:w-[620px]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
            </h2>
          </div>

          <AddSpeakerForm
            defaultValues={editingSpeaker || undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Sortable header helper
function sortableHeader(label: string) {
  const HeaderComponent = ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {label}
        {sorted === 'asc' && <ArrowUp className="h-4 w-4 ml-2" />}
        {sorted === 'desc' && <ArrowDown className="h-4 w-4 ml-2" />}
        {!sorted && <ArrowUpDown className="h-4 w-4 ml-2" />}
      </Button>
    )
  }

  HeaderComponent.displayName = `SortableHeader(${label})`
  return HeaderComponent
}
