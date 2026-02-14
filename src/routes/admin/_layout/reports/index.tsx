import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

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
import { getAdminReports } from '@/lib/server/admin/reports'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional().default(''),
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed', 'all']).optional().default('all'),
})

export const Route = createFileRoute('/admin/_layout/reports/')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const data = await getAdminReports({ data: deps })
      return { ok: true as const, data }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('UNAUTHORIZED')) {
        return { ok: false as const, reason: 'unauthorized' as const }
      }
      if (message.includes('FORBIDDEN')) {
        return { ok: false as const, reason: 'forbidden' as const }
      }
      throw error
    }
  },
  component: AdminReportsPage,
})

function AdminReportsPage() {
  const loaderData = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [searchInput, setSearchInput] = useState(search.search)

  if (!loaderData.ok) {
    if (loaderData.reason === 'unauthorized') {
      return (
        <AdminAccessState
          title='Sign in required'
          description='You need to sign in to access reports.'
          ctaLabel='Go to sign in'
          ctaTo='/auth/sign-in'
        />
      )
    }

    return (
      <AdminAccessState
        title='Access denied'
        description='Your account does not have permission to view reports.'
        ctaLabel='Back to home'
        ctaTo='/'
      />
    )
  }

  const { reports, pagination } = loaderData.data

  const updateSearch = (next: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...next }),
    })
  }

  return (
    <div className='space-y-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Reports</h1>
        <div className='flex gap-2'>
          <Input
            placeholder='Search reason / user id...'
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className='w-72'
          />
          <Button
            variant='outline'
            onClick={() => updateSearch({ page: 1, search: searchInput.trim() })}
          >
            Search
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Status</span>
        {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map(
          (status) => (
            <Button
              key={status}
              variant={search.status === status ? 'default' : 'outline'}
              onClick={() => updateSearch({ status, page: 1 })}
            >
              {status}
            </Button>
          ),
        )}
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length ? (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell className='capitalize'>{report.reportType}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell className='font-mono text-xs'>
                    {report.reportedUserId}
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary' className='capitalize'>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString('en-US')}
                  </TableCell>
                  <TableCell>
                    <Link
                      to='/admin/reports/$reportId'
                      params={{ reportId: String(report.id) }}
                      className='text-sm text-primary hover:underline'
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center'>
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between py-2'>
        <div className='text-sm text-muted-foreground'>
          Showing {reports.length} of {pagination.total} reports
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
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant='outline'
            disabled={search.page >= pagination.totalPages}
            onClick={() => updateSearch({ page: search.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
