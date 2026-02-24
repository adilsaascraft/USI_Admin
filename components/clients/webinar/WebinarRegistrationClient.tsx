'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { Checkbox } from '@/components/ui/checkbox'
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
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'
import { ExportCsvButton } from '@/components/export-csv-button'

/* ================= TYPES ================= */

type WebinarRegistration = {
  registrationId: string
  registeredOn: string
  user: {
    _id: string
    prefix: string
    name: string
    email: string
    mobile: string
  } | null
  email?: string
}

/* ================= PAGE ================= */

export default function WebinarRegistrationClient({
  webinarId,
}: {
  webinarId: string
}) {
  const [sendingReminder, setSendingReminder] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, error } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinar/${webinarId}/registrations-simple`,
    fetcher,
  )

  const regList: WebinarRegistration[] = useMemo(() => data?.data ?? [], [data])

  /* ================= DYNAMIC FILE NAME ================= */

  const fileName = useMemo(() => {
    const webinarName =
      data?.webinar?.name || data?.webinarName || `Webinar-${webinarId}`

    return `${webinarName}.csv`
  }, [data, webinarId])

  /* ================= SEND REMINDER ================= */

  const sendReminderEmail = async () => {
    if (sendingReminder) return

    try {
      setSendingReminder(true)

      const res = await apiRequest({
        endpoint: `/api/admin/webinar/${webinarId}/send-join-webinar`,
        method: 'POST',
        showToast: true,
        successMessage: 'Reminder email sent successfully',
      })

      // Only close if success
      if (res?.success) {
        setDialogOpen(false)
      }
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSendingReminder(false)
    }
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<WebinarRegistration>[] = [
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
      id: 'name',
      accessorFn: (row) =>
        row.user ? `${row.user.prefix}. ${row.user.name}` : '',
      header: sortableHeader('Full Name'),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.user
            ? `${row.original.user.prefix}. ${row.original.user.name}`
            : '—'}
        </span>
      ),
    },

    {
      id: 'email',
      accessorFn: (row) => row.user?.email ?? row.email ?? '',
      header: sortableHeader('Email'),
      cell: ({ row }) => (
        <span>{row.original.user?.email ?? row.original.email ?? '—'}</span>
      ),
    },

    {
      id: 'mobile',
      accessorFn: (row) => row.user?.mobile ?? '',
      header: sortableHeader('Mobile'),
      cell: ({ row }) => <span>{row.original.user?.mobile ?? '—'}</span>,
    },

    {
      accessorKey: 'registeredOn',
      header: sortableHeader('Registered At'),
      cell: ({ row }) => (
        <span>
          {getIndianFormattedDate(new Date(row.original.registeredOn))}
        </span>
      ),
    },
  ]

  /* ================= STATES ================= */

  if (isLoading) return <EntitySkeleton title="All Registrations" />

  if (error)
    return <div className="p-4 text-red-600">Failed to load registrations</div>

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Registrations</h1>

        <div className="flex gap-2">
          {/* CSV EXPORT */}
          <ExportCsvButton
            fileName={fileName}
            data={regList}
            columns={[
              {
                header: 'Full Name',
                value: (r) =>
                  r.user ? `${r.user.prefix}. ${r.user.name}` : '—',
              },
              {
                header: 'Email',
                value: (r) => r.user?.email ?? r.email ?? '—',
              },
              {
                header: 'Mobile',
                value: (r) => r.user?.mobile ?? '—',
              },
              {
                header: 'Registered At',
                value: (r) => getIndianFormattedDate(new Date(r.registeredOn)),
              },
            ]}
          />

          {/* ALERT DIALOG */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                variant="outline"
                disabled={regList.length === 0}
              >
                Send Reminder Email
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Reminder Email?</AlertDialogTitle>

                <AlertDialogDescription>
                  This will send a reminder email to{' '}
                  <span className="font-semibold text-orange-600">
                    {regList.length}
                  </span>{' '}
                  registered users.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={sendingReminder}>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={sendingReminder}
                  onClick={(e) => {
                    e.preventDefault()
                    sendReminderEmail()
                  }}
                >
                  {sendingReminder ? 'Sending...' : 'Confirm'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Table */}
      <DataTable data={regList} columns={columns} />
    </div>
  )
}

/* ================= SORT HEADER ================= */

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