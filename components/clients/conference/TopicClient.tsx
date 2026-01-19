'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Video } from 'lucide-react'
import { toast } from 'sonner'

import AddTopicForm from '@/components/forms/conference/AddTopicForm'
import { DataTable } from '@/components/DataTable'
import { fetcher } from '@/lib/fetcher'
import { fetchClient } from '@/lib/fetchClient'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

/* ================= TYPES ================= */

type Speaker = {
  _id: string
  prefix?: string
  speakerName: string
  speakerProfilePicture?: string
  country?: string
}

type Session = {
  _id: string
  sessionName: string
  chairperson?: Speaker[]
}

type TopicRow = {
  _id: string
  title: string
  topicType: 'Presentation' | 'Quiz' | 'Panel Discussion'
  startTime: string
  endTime: string
  videoLink?: string
  sessionId: Session
  speakerId: Speaker[]
  moderator?: Speaker
  panelist?: Speaker[]
  quizMaster?: Speaker
  teamMember?: Speaker[]
}

/* ================= HELPERS ================= */

const renderSpeaker = (s: Speaker) =>
  `${s.prefix ? s.prefix + ' ' : ''}${s.speakerName}${
    s.country ? ` (${s.country})` : ''
  }`

/* ================= COMPONENT ================= */

export default function TopicClient({
  conferenceId,
}: {
  conferenceId: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null)

  const { data, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC__URL}/conferences/${conferenceId}/topics`,
    fetcher
  )

  const topics: TopicRow[] = useMemo(() => data?.data ?? [], [data])

  const handleAdd = () => {
    setEditingTopic(null)
    setSheetOpen(true)
  }

  const handleEdit = (topic: TopicRow) => {
    setEditingTopic(topic)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchClient(
        `${process.env.NEXT_PUBLIC__URL}/admin/topics/${id}`,
        { method: 'DELETE' }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message)

      toast.warning('Topic deleted successfully!', {
        description: getIndianFormattedDate(),
      })

      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
    }
  }

  const handleSave = async () => {
    setSheetOpen(false)
    setEditingTopic(null)
    await mutate()
  }

  /* ================= TABLE ================= */

  const columns: ColumnDef<TopicRow>[] = [
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
      enableSorting: false,
    },

    {
      accessorKey: 'title',
      header: sortableHeader('Topic Title'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.sessionId?.sessionName || ''}
          </p>
        </div>
      ),
    },

    {
      accessorKey: 'topicType',
      header: sortableHeader('Type'),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.topicType}</Badge>
      ),
    },

    {
      id: 'time',
      header: 'Time Slot',
      cell: ({ row }) => `${row.original.startTime} – ${row.original.endTime}`,
    },

    /* ===== CHAIRPERSONS ===== */
    {
      id: 'chairpersons',
      header: 'Chairperson(s)',
      cell: ({ row }) => {
        const chairs = row.original.sessionId?.chairperson || []

        if (!chairs.length) {
          return <span className="text-muted-foreground">—</span>
        }

        return (
          <Accordion type="single" collapsible>
            <AccordionItem value="chair">
              <AccordionTrigger className="py-0">
                {chairs.length} Chairperson(s)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 text-sm">
                  {chairs.map((c) => (
                    <p key={c._id}>• {renderSpeaker(c)}</p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      },
    },

    /* ===== SPEAKERS (PRESENTATION) ===== */
    {
      id: 'speakers',
      header: 'Speakers',
      cell: ({ row }) => {
        if (row.original.topicType !== 'Presentation') {
          return <span className="text-muted-foreground">—</span>
        }

        const speakers = row.original.speakerId || []

        if (!speakers.length) {
          return <span className="text-muted-foreground">—</span>
        }

        return (
          <Accordion type="single" collapsible>
            <AccordionItem value="speakers">
              <AccordionTrigger className="py-0">
                {speakers.length} Speaker(s)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 text-sm">
                  {speakers.map((s) => (
                    <p key={s._id}>• {renderSpeaker(s)}</p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      },
    },

    /* ===== ROLES (PANEL / QUIZ) ===== */
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const t = row.original

        return (
          <div className="space-y-1">
            {t.moderator && (
              <Accordion type="single" collapsible>
                <AccordionItem value="moderator">
                  <AccordionTrigger className="py-0">
                    Moderator
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm">• {renderSpeaker(t.moderator)}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {t.panelist?.length ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="panelist">
                  <AccordionTrigger className="py-0">
                    Panelist ({t.panelist.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 text-sm">
                      {t.panelist.map((p) => (
                        <p key={p._id}>• {renderSpeaker(p)}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}

            {t.quizMaster && (
              <Accordion type="single" collapsible>
                <AccordionItem value="quiz">
                  <AccordionTrigger className="py-0">
                    Quiz Master
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm">• {renderSpeaker(t.quizMaster)}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {t.teamMember?.length ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="team">
                  <AccordionTrigger className="py-0">
                    Team ({t.teamMember.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 text-sm">
                      {t.teamMember.map((m) => (
                        <p key={m._id}>• {renderSpeaker(m)}</p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </div>
        )
      },
    },

    {
      id: 'video',
      header: 'Video',
      cell: ({ row }) =>
        row.original.videoLink ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.open(row.original.videoLink, '_blank')}
          >
            <Video className="h-4 w-4" />
          </Button>
        ) : (
          '-'
        ),
    },

    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
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
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{' '}
                  <span className="font-semibold">{row.original.title}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
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

  if (isLoading) return <EntitySkeleton title="Topics" />

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={handleAdd}
        >
          + Add Topic
        </Button>
      </div>

      <DataTable data={topics} columns={columns} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[600px]">
          <AddTopicForm
            conferenceId={conferenceId}
            defaultValues={editingTopic || undefined}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================= SORT HEADER ================= */

function sortableHeader(label: string) {
  return ({ column }: any) => {
    const sorted = column.getIsSorted()
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        {label}
        {sorted === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
        {sorted === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
        {!sorted && <ArrowUpDown className="ml-2 h-4 w-4" />}
      </Button>
    )
  }
}
