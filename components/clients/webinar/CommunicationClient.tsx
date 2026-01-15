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
import {
  AlertDialog,
  AlertDialogTrigger,
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
  userId: {
    _id: string
    prefix: string
    name: string
    email?: string
    mobile?: string
    profilePicture?: string
  }
}

type ApiResponse = {
  data: Registration[]
  webinar: {
    attendedMailSent: boolean
    notAttendedMailSent: boolean
  }
}

/* ================= COMPONENT ================= */

export default function CommunicationClient({
  webinarId,
}: {
  webinarId: string
}) {
  const [activeTab, setActiveTab] = useState<
    'attended' | 'not-attended' | 'responses'
  >('attended')

  /* ================= FETCH ================= */

  const { data, isLoading, mutate } = useSWR<ApiResponse>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinar/${webinarId}/registrations`,
    fetcher
  )

  const registrations = useMemo(() => data?.data ?? [], [data])

  const attendedUsers = useMemo(
    () => registrations.filter((r) => r.attended),
    [registrations]
  )

  const notAttendedUsers = useMemo(
    () => registrations.filter((r) => !r.attended),
    [registrations]
  )

  const attendedMailSent = data?.webinar?.attendedMailSent ?? false
  const notAttendedMailSent = data?.webinar?.notAttendedMailSent ?? false

  /* ================= SURVEY LINK ================= */

  const surveyLink = `${process.env.NEXT_PUBLIC_FEEDBACK_URL}/${webinarId}/submit-feedback-by-user`

  /* ================= BULK EMAIL ================= */

  const sendBulkMail = async (type: 'attended' | 'not-attended') => {
    const endpoint =
      type === 'attended'
        ? `/api/admin/webinar/${webinarId}/email/attended`
        : `/api/admin/webinar/${webinarId}/email/not-attended`

    await apiRequest({
      endpoint,
      method: 'POST',
      body: type === 'attended' ? { surveyLink } : undefined,
      showToast: true,
      successMessage: 'Email sent successfully',
    })

    await mutate()
  }

  /* ================= INDIVIDUAL RESEND ================= */

  const resendIndividual = async (
    type: 'attended' | 'not-attended',
    userId: string
  ) => {
    const endpoint =
      type === 'attended'
        ? `/api/admin/webinar/${webinarId}/email/attended-user`
        : `/api/admin/webinar/${webinarId}/email/not-attended-user`

    await apiRequest({
      endpoint,
      method: 'POST',
      body: type === 'attended' ? { userId, surveyLink } : { userId },
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
              onClick={() =>
                resendIndividual(
                  isAttended ? 'attended' : 'not-attended',
                  row.original.userId._id
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
      {/* Tabs */}
      <div className="flex gap-6 border-b">
        {[
          { key: 'attended', label: 'Attended', count: attendedUsers.length },
          {
            key: 'not-attended',
            label: 'Not Attended',
            count: notAttendedUsers.length,
          },
          { key: 'responses', label: 'Responses', count: 0 },
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

      {/* ATTENDED */}
      {activeTab === 'attended' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Attended Users</h2>

            {!attendedMailSent && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Send Feedback Form
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Send feedback form to all attended users?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send the feedback form link to all users who
                      attended the webinar. Please note that you can send this
                      only once. After this, you can resend individually.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => sendBulkMail('attended')}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <DataTable data={attendedUsers} columns={columns} />
        </>
      )}

      {/* NOT ATTENDED */}
      {activeTab === 'not-attended' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Not Attended Users</h2>

            {!notAttendedMailSent && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Send Reminder Email
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Send reminder email to all not-attended users?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send a reminder email to all users who did not
                      attend the webinar. Please note that you can send this
                      only once. After this, you can resend individually.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => sendBulkMail('not-attended')}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <DataTable data={notAttendedUsers} columns={columns} />
        </>
      )}

      {activeTab === 'responses' && (
        <div className="text-muted-foreground">No responses available yet.</div>
      )}
    </div>
  )
}
