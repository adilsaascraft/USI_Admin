'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import EntitySkeleton from '@/components/EntitySkeleton'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import { Checkbox } from '@/components/ui/checkbox'

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

/* ================= HELPERS ================= */

const getFullName = (row: WebinarRegistration) =>
  row.user ? `${row.user.prefix}. ${row.user.name}` : '—'

const getEmail = (row: WebinarRegistration) =>
  row.user?.email ?? row.email ?? '—'

const getMobile = (row: WebinarRegistration) =>
  row.user?.mobile ?? '—'

/* ================= PAGE ================= */

export default function WebinarRegistrationClient({
  webinarId,
}: {
  webinarId: string
}) {
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinar/${webinarId}/registrations-simple`,
    fetcher
  )

  const regList: WebinarRegistration[] = useMemo(
    () => data?.data ?? [],
    [data]
  )

 

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    const headers = ['Full Name', 'Email', 'Mobile', 'Registered At']

    const rows = regList.map((row) => [
      getFullName(row),
      getEmail(row),
      getMobile(row),
      getIndianFormattedDate(new Date(row.registeredOn)),
    ])

    const csvContent =
      [headers, ...rows]
        .map((r) => r.map((v) => `"${v}"`).join(','))
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'webinar-registrations.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  /* ================= COLUMNS ================= */

  const columns: ColumnDef<WebinarRegistration>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) =>
          row.toggleSelected(!!value)
        }
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
        {getFullName(row.original)}
      </span>
    ),
  },

  {
    id: 'email',
    accessorFn: (row) =>
      row.user?.email ?? row.email ?? '',
    header: sortableHeader('Email'),
    cell: ({ row }) => <span>{getEmail(row.original)}</span>,
  },

  {
    id: 'mobile',
    accessorFn: (row) =>
      row.user?.mobile ?? '',
    header: sortableHeader('Mobile'),
    cell: ({ row }) => <span>{getMobile(row.original)}</span>,
  },

  {
    accessorKey: 'registeredOn',
    header: sortableHeader('Registered At'),
    cell: ({ row }) => (
      <span>
        {getIndianFormattedDate(
          new Date(row.original.registeredOn)
        )}
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
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
