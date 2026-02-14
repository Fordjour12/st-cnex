import { Link, createFileRoute } from '@tanstack/react-router'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'

import { AdminAccessState } from '@/components/admin-access-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAdminUsers } from '@/lib/server/admin/users'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional().default(''),
  sortBy: z.enum(['createdAt', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

type PageData = Awaited<ReturnType<typeof getAdminUsers>>

export const Route = createFileRoute('/admin/_layout/users/')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const data = await getAdminUsers({ data: deps })
      return {
        ok: true as const,
        data,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''

      if (message.includes('UNAUTHORIZED')) {
        return {
          ok: false as const,
          reason: 'unauthorized' as const,
        }
      }

      if (message.includes('FORBIDDEN')) {
        return {
          ok: false as const,
          reason: 'forbidden' as const,
        }
      }

      throw error
    }
  },
  component: AdminUsersPage,
})

type UserRecord = NonNullable<PageData['users']>[number]

function AdminUsersPage() {
  const loaderData = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [searchInput, setSearchInput] = useState(search.search)

  if (!loaderData.ok) {
    if (loaderData.reason === 'unauthorized') {
      return (
        <AdminAccessState
          title='Sign in required'
          description='You need to sign in to access admin users.'
          ctaLabel='Go to sign in'
          ctaTo='/auth/sign-in'
        />
      )
    }

    return (
      <AdminAccessState
        title='Access denied'
        description='Your account does not have permission to view users.'
        ctaLabel='Back to home'
        ctaTo='/'
      />
    )
  }

  const data = loaderData.data

  const columns: Array<ColumnDef<UserRecord>> = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium'>{row.original.email}</span>
            <span className='text-xs text-muted-foreground'>
              ID: {row.original.id.slice(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name || <span className='text-muted-foreground'>-</span>,
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
          <div className='flex gap-1'>
            <Badge variant={row.original.emailVerified ? 'default' : 'secondary'}>
              {row.original.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
            {row.original.banned && <Badge variant='destructive'>Banned</Badge>}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Link
            to='/admin/users/$userId'
            params={{ userId: row.original.id }}
            className='text-sm text-primary hover:underline'
          >
            View
          </Link>
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

  const updateSearch = (next: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...next,
      }),
    })
  }

  return (
    <div className='space-y-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>User Management</h1>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search by email...'
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className='w-64'
          />
          <Button
            variant='outline'
            onClick={() =>
              updateSearch({
                page: 1,
                search: searchInput.trim(),
              })
            }
          >
            Search
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Sort by</span>
        <Button
          variant={search.sortBy === 'createdAt' ? 'default' : 'outline'}
          onClick={() => updateSearch({ sortBy: 'createdAt', page: 1 })}
        >
          Joined
        </Button>
        <Button
          variant={search.sortBy === 'email' ? 'default' : 'outline'}
          onClick={() => updateSearch({ sortBy: 'email', page: 1 })}
        >
          Email
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            updateSearch({
              sortOrder: search.sortOrder === 'desc' ? 'asc' : 'desc',
              page: 1,
            })
          }
        >
          {search.sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        </Button>
      </div>

      <div className='rounded-md border'>
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
            {table.getRowModel().rows.length ? (
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
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between py-2'>
        <div className='text-sm text-muted-foreground'>
          Showing {data.users.length} of {data.pagination.total} users
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: search.page - 1 })}
          >
            Previous
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {data.pagination.page} of {data.pagination.totalPages || 1}
          </span>
          <Button
            variant='outline'
            disabled={search.page >= data.pagination.totalPages}
            onClick={() => updateSearch({ page: search.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
