'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { fetcher } from '@/lib/fetcher'
import { apiRequest } from '@/lib/apiRequest'
import EntitySkeleton from '../EntitySkeleton'
import { Input } from '@/components/ui/input'
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

type User = {
  _id: string
  prefix: string
  name: string
  email: string
  mobile: string
  qualification: string
  affiliation?: string
  country: string
  state?: string
  city?: string
  status: 'Pending' | 'Approved'
}

const tabs = ['Pending', 'Approved', 'All'] as const
type Tab = (typeof tabs)[number]

export default function UsersClient() {
  const [activeTab, setActiveTab] = useState<Tab>('Pending')
  const [search, setSearch] = useState('')
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/all`,
    fetcher
  )

  const users: User[] = useMemo(() => data?.users ?? [], [data])

  // Status counts
  const statusCounts = useMemo(() => {
    const pending = users.filter((u) => u.status === 'Pending').length
    const approved = users.filter((u) => u.status === 'Approved').length
    return {
      Pending: pending,
      Approved: approved,
      All: users.length,
    }
  }, [users])

  // Update status API
  const updateStatus = async (
    userId: string,
    status: 'Pending' | 'Approved'
  ) => {
    try {
      setLoadingUserId(userId)

      await apiRequest({
        endpoint: `/api/users/status/${userId}`,
        method: 'PUT',
        body: { status },
        showToast: true,
        successMessage: `User ${
          status === 'Approved' ? 'approved' : 'suspended'
        } successfully`,
      })

      mutate(
        (prev: any) => ({
          ...prev,
          users: prev.users.map((u: User) =>
            u._id === userId ? { ...u, status } : u
          ),
        }),
        false
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status')
    } finally {
      setLoadingUserId(null)
    }
  }

  // Tab filter
  const tabFilteredUsers = useMemo(() => {
    if (activeTab === 'All') return users
    return users.filter((u) => u.status === activeTab)
  }, [activeTab, users])

  // Search filter
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase()

    return tabFilteredUsers.filter((u) => {
      return (
        `${u.prefix} ${u.name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobile.includes(q) ||
        u.qualification?.toLowerCase().includes(q) ||
        u.affiliation?.toLowerCase().includes(q) ||
        `${u.country} ${u.state ?? ''} ${u.city ?? ''}`
          .toLowerCase()
          .includes(q)
      )
    })
  }, [search, tabFilteredUsers])

  // Columns
  const columns: ColumnDef<User>[] = [
    {
      accessorFn: (row) => `${row.prefix} ${row.name}`,
      id: 'name',
      header: sortableHeader('Name'),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.prefix} {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'qualification',
      header: sortableHeader('Qualification'),
    },
    {
      accessorKey: 'affiliation',
      header: sortableHeader('Affiliation'),
    },
    {
      accessorKey: 'email',
      header: sortableHeader('Email'),
    },
    {
      accessorKey: 'mobile',
      header: sortableHeader('Mobile'),
    },
    
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="text-sm">
          {[row.original.country, row.original.state, row.original.city]
            .filter(Boolean)
            .join(', ')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'Approved' ? 'default' : 'secondary'}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const isApproved = row.original.status === 'Approved'
        const isLoading = loadingUserId === row.original._id

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={isLoading}
                className={
                  isApproved
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-800 hover:bg-green-900 text-white'
                }
              >
                {isLoading ? 'Updating...' : isApproved ? 'Suspend' : 'Approve'}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isApproved ? 'Suspend User?' : 'Approve User?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isApproved
                    ? 'This will suspend the user and revoke their access to the platform.'
                    : 'This will approve the user and grant them access to the platform.'}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className={isApproved ? 'bg-red-600 hover:bg-red-700' : 'bg-green-800 hover:bg-green-900'}
                  disabled={isLoading}
                  onClick={() =>
                    updateStatus(
                      row.original._id,
                       isApproved ? 'Pending' : 'Approved'
                    )
                  }
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  if (isLoading) return <EntitySkeleton title="Users" />
  if (error) return <div className="text-red-600">Failed to load users</div>

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">All Users</h1>
      </div>

      {/* Tabs with counts */}
      <div className="flex gap-6 mb-4 text-sm text-gray-600 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 flex items-center gap-2 ${
              tab === activeTab
                ? 'border-orange-600 text-orange-600 font-semibold'
                : 'border-transparent hover:text-foreground'
            }`}
          >
            {tab}
            <Badge variant="secondary">{statusCounts[tab]}</Badge>
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable data={filteredUsers} columns={columns} />
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
