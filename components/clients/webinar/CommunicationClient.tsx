'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { apiRequest } from '@/lib/apiRequest'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { ExportCsvButton } from '@/components/export-csv-button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

/* ================= TYPES ================= */

type Registration = {
  _id: string
  attended: boolean
  attendedAt?: string
  userId: {
    _id: string
    prefix: string
    name: string
    email?: string
    mobile?: string
    qualification?: string
    affiliation?: string
    country?: string
    profilePicture?: string
  }
}

type Response = {
  data: Registration[]
  webinar: {
    attendedMailSent: boolean
    notAttendedMailSent: boolean
    name?: string
  }
}

/* ================= COMPONENT ================= */

export default function CommunicationClient({
  webinarId,
}: {
  webinarId: string
}) {
  const [activeTab, setActiveTab] = useState<'attended' | 'not-attended'>(
    'attended',
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkType, setBulkType] = useState<'attended' | 'not-attended'>(
    'attended',
  )
  const [isSending, setIsSending] = useState(false)

  /* ================= FETCH ================= */

  const { data, isLoading, mutate } = useSWR<Response>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinar/${webinarId}/registrations`,
    fetcher,
  )

  const registrations = useMemo(() => data?.data ?? [], [data])

  const attendedUsers = useMemo(
    () => registrations.filter((r) => r.attended),
    [registrations],
  )

  const notAttendedUsers = useMemo(
    () => registrations.filter((r) => !r.attended),
    [registrations],
  )

  const attendedMailSent = data?.webinar?.attendedMailSent ?? false
  const notAttendedMailSent = data?.webinar?.notAttendedMailSent ?? false

  /* ================= ACTIVE DATA ================= */

  const activeData =
    activeTab === 'attended' ? attendedUsers : notAttendedUsers

  /* ================= FILE NAME ================= */

  const fileName = useMemo(() => {
    const webinarName = data?.webinar?.name ?? 'USI Webinar'
    return activeTab === 'attended'
      ? `${webinarName} Attended.csv`
      : `${webinarName} Not Attended.csv`
  }, [data, activeTab])

  /* ================= SURVEY LINK ================= */

  const surveyLink = `${process.env.NEXT_PUBLIC_FEEDBACK_URL}/${webinarId}/submit-feedback-by-user`

  /* ================= BULK EMAIL ================= */

  const sendBulkMail = async (type: 'attended' | 'not-attended') => {
    try {
      setIsSending(true)

      const endpoint =
        type === 'attended'
          ? `/api/admin/webinar/${webinarId}/email/attended`
          : `/api/admin/webinar/${webinarId}/email/not-attended`

      const res = await apiRequest({
        endpoint,
        method: 'POST',
        body: type === 'attended' ? { surveyLink } : undefined,
        showToast: true,
        successMessage: 'Email sent successfully',
      })

      if (res?.success) {
        await mutate()
        setDialogOpen(false)
      }
    } finally {
      setIsSending(false)
    }
  }

  /* ================= INDIVIDUAL RESEND ================= */

  const resendIndividual = async (
    type: 'attended' | 'not-attended',
    userId: string,
  ) => {
    const endpoint =
      type === 'attended'
        ? `/api/admin/webinar/${webinarId}/email/attended/${userId}`
        : `/api/admin/webinar/${webinarId}/email/not-attended/${userId}`

    await apiRequest({
      endpoint,
      method: 'POST',
      body: type === 'attended' ? { surveyLink } : undefined,
      showToast: true,
      successMessage: 'Email resent successfully',
    })
  }

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo<ColumnDef<Registration>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        ),
      },
      {
        header: 'User',
        accessorFn: (row) =>
          `${row.userId.name} ${row.userId.email} ${row.userId.mobile}`,
        cell: ({ row }) => {
          const u = row.original.userId
          return (
            <div className="flex items-center gap-3">
              <Image
                src={u.profilePicture || '/avatar.png'}
                alt={u.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-medium">
                  {u.prefix} {u.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {u.email || u.mobile}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        header: 'Status',
        cell: ({ row }) =>
          row.original.attended ? (
            <Badge className="bg-green-600">Attended</Badge>
          ) : (
            <Badge variant="secondary">Not Attended</Badge>
          ),
      },
      {
        header: 'Attended At',
        cell: ({ row }) =>
          row.original.attendedAt
            ? getIndianFormattedDate(new Date(row.original.attendedAt))
            : '—',
      },
      {
        header: 'Action',
        cell: ({ row }) => {
          const isAttended = row.original.attended

          if (
            (isAttended && !attendedMailSent) ||
            (!isAttended && !notAttendedMailSent)
          ) {
            return null
          }

          return (
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() =>
                resendIndividual(
                  isAttended ? 'attended' : 'not-attended',
                  row.original.userId._id,
                )
              }
            >
              Resend
            </Button>
          )
        },
      },
    ]
  }, [attendedMailSent, notAttendedMailSent])

  /* ================= UI ================= */

  if (isLoading) return <EntitySkeleton title="Communication" />

  return (
    <div className="space-y-4">
      {/* Bulk Buttons */}
      <div className="flex gap-4">
        <Button
        variant="secondary"
          onClick={() => {
            setBulkType('attended')
            setDialogOpen(true)
          }}
          disabled={attendedMailSent}
        >
          Send Feedback Form
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setBulkType('not-attended')
            setDialogOpen(true)
          }}
          disabled={notAttendedMailSent}
        >
          Send Not Attended Mail
        </Button>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
           <AlertDialogDescription>
  {bulkType === 'attended' ? (
    <>
      This will send a <span className="font-semibold text-orange-600">feedback form email</span> to all{' '}
      <span className="font-semibold">attended users</span>.
      <br />
      They will receive a survey link to submit their feedback.
    </>
  ) : (
    <>
      This will send a <span className="font-semibold text-orange-600">thank you / informational email</span> to all{' '}
      <span className="font-semibold">not attended users</span>.
      <br />
      No feedback form will be included.
    </>
  )}
</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSending}
              onClick={(e) => {
                e.preventDefault()
                sendBulkMail(bulkType)
              }}
              className='bg-orange-600 hover:bg-orange-700 text-white'
            >
              {isSending ? 'Sending...' : 'Confirm & Send'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs */}
      <div className="flex justify-between items-center border-b">
        <div className="flex gap-6">
          {[
            { key: 'attended', label: 'Attended', count: attendedUsers.length },
            {
              key: 'not-attended',
              label: 'Not Attended',
              count: notAttendedUsers.length,
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-2 flex gap-2 ${
                activeTab === t.key
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-500'
              }`}
            >
              {t.label}
              <Badge variant="secondary">{t.count}</Badge>
            </button>
          ))}
        </div>

        <ExportCsvButton fileName={fileName} data={activeData} columns={[]} />
      </div>

      {/* Table */}
      <DataTable data={activeData} columns={columns} />
    </div>
  )
}