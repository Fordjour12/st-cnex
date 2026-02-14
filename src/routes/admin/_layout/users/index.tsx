import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { UserService } from '@/lib/server/user'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/admin/_layout/users/')({
  loader: async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return await UserService.getUsers({ page: 1, limit: 50 })
  },
  component: AdminUsersPage,
})

interface UserData {
  users: {
    id: string
    email: string
    name: string | null
    createdAt: Date
    emailVerified: boolean
    banned: boolean | null
  }[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function AdminUsersPage() {
  const data = Route.useLoaderData() as unknown as UserData
  const [search, setSearch] = useState('')

  const columns: ColumnDef<UserData['users'][0]>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.email}</span>
            <span className="text-xs text-muted-foreground">
              ID: {row.original.id.slice(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) =>
          row.original.name || <span className="text-muted-foreground">-</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
      },
      {
        accessorKey: 'emailVerified',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Badge
              variant={row.original.emailVerified ? 'default' : 'secondary'}
            >
              {row.original.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
            {row.original.banned && <Badge variant="destructive">Banned</Badge>}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <a
            href={`/admin/users/${row.original.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View
          </a>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: data.users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {data.users.length} of {data.pagination.total} users
        </div>
      </div>
    </div>
  )
}
