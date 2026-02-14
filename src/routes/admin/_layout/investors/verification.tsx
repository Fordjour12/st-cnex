import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { z } from 'zod'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { db } from '@/db'
import { investorProfiles } from '@/db/schema/profile'
import { user } from '@/db/schema/auth'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { verifyInvestor } from '@/lib/server/admin/investors'
import { RBACService } from '@/lib/server/rbac'
import { PERMISSIONS } from '@/lib/permissions'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  status: z
    .enum(['pending', 'verified', 'rejected', 'all'])
    .optional()
    .default('pending'),
  investorType: z.string().optional().default(''),
  dateFrom: z.string().optional().default(''),
  dateTo: z.string().optional().default(''),
})

export const Route = createFileRoute('/admin/_layout/investors/verification')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const canVerify = await RBACService.hasPermission(
      session.user.id,
      PERMISSIONS.INVESTORS_VERIFY,
    )

    if (!canVerify) {
      throw new Error('Forbidden')
    }

    const conditions = []

    if (deps.status && deps.status !== 'all') {
      conditions.push(eq(investorProfiles.verificationStatus, deps.status))
    }

    if (deps.investorType) {
      conditions.push(eq(investorProfiles.investorType, deps.investorType))
    }

    if (deps.dateFrom) {
      conditions.push(gte(investorProfiles.createdAt, new Date(deps.dateFrom)))
    }

    if (deps.dateTo) {
      conditions.push(lte(investorProfiles.createdAt, new Date(deps.dateTo)))
    }

    const offset = ((deps.page ?? 1) - 1) * (deps.limit ?? 20)

    const [investors, countResult] = await Promise.all([
      db
        .select({
          userId: investorProfiles.userId,
          investorType: investorProfiles.investorType,
          investmentRangeMin: investorProfiles.investmentRangeMin,
          investmentRangeMax: investorProfiles.investmentRangeMax,
          industriesOfInterest: investorProfiles.industriesOfInterest,
          verificationStatus: investorProfiles.verificationStatus,
          linkedinUrl: investorProfiles.linkedinUrl,
          portfolioUrl: investorProfiles.portfolio,
          createdAt: investorProfiles.createdAt,
          email: user.email,
          name: user.name,
        })
        .from(investorProfiles)
        .innerJoin(user, eq(investorProfiles.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(investorProfiles.createdAt))
        .limit(deps.limit ?? 20)
        .offset(offset),
      db
        .select({ count: investorProfiles.userId })
        .from(investorProfiles)
        .where(and(...conditions)),
    ])

    return {
      investors,
      pagination: {
        page: deps.page ?? 1,
        limit: deps.limit ?? 20,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / (deps.limit ?? 20)),
      },
    }
  },
  component: InvestorVerificationPage,
})

interface Investor {
  userId: string
  investorType: string | null
  investmentRangeMin: string | null
  investmentRangeMax: string | null
  industriesOfInterest: string[] | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
  linkedinUrl: string | null
  portfolioUrl: string[] | null
  createdAt: Date
  email: string
  name: string | null
}

type SearchParams = z.infer<typeof searchSchema>

function InvestorVerificationPage() {
  const data = Route.useLoaderData() as unknown as {
    investors: Investor[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  const search = Route.useSearch() as SearchParams
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const updateSearch = (next: Partial<typeof search>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...next }),
    })
  }

  const runAction = async (
    fn: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setActionError(null)
    setActionSuccess(null)
    setIsSubmitting(true)

    try {
      await fn()
      setActionSuccess(successMessage)
      await router.invalidate()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('FORBIDDEN')) {
        setActionError('You do not have permission for this action.')
      } else if (message.includes('UNAUTHORIZED')) {
        setActionError('Your session has expired. Sign in again.')
      } else {
        setActionError('Action failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
      setProcessingId(null)
    }
  }

  const handleVerify = async (
    userId: string,
    status: 'verified' | 'rejected',
  ) => {
    setProcessingId(userId)
    await runAction(
      async () =>
        verifyInvestor({
          data: {
            userId,
            status,
          },
        }),
      `Investor ${status}.`,
    )
  }

  const columns: ColumnDef<Investor>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.email}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.name || '-'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'investorType',
        header: 'Type',
        cell: ({ row }) => row.original.investorType || '-',
      },
      {
        accessorKey: 'investmentRange',
        header: 'Investment Range',
        cell: ({ row }) =>
          row.original.investmentRangeMin && row.original.investmentRangeMax
            ? `$${row.original.investmentRangeMin} - $${row.original.investmentRangeMax}`
            : '-',
      },
      {
        accessorKey: 'verificationStatus',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.verificationStatus === 'verified'
                ? 'default'
                : row.original.verificationStatus === 'rejected'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {row.original.verificationStatus}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const status = row.original.verificationStatus
          const userId = row.original.userId
          const isProcessing = processingId === userId && isSubmitting

          if (status !== 'pending') {
            return (
              <span className="text-sm text-muted-foreground">
                {status === 'verified' ? 'Approved' : 'Rejected'}
              </span>
            )
          }

          return (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => void handleVerify(userId, 'verified')}
                disabled={isProcessing}
              >
                {isProcessing ? '...' : 'Approve'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleVerify(userId, 'rejected')}
                disabled={isProcessing}
              >
                {isProcessing ? '...' : 'Reject'}
              </Button>
            </div>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: data.investors,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Investor Verification</h1>
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-destructive">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="mb-4 text-sm text-emerald-600">{actionSuccess}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          {(['all', 'pending', 'verified', 'rejected'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={search.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSearch({ status, page: 1 })}
              >
                {status}
              </Button>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type</span>
          <select
            className="rounded-md border px-3 py-1 text-sm"
            value={search.investorType || ''}
            onChange={(e) =>
              updateSearch({ investorType: e.target.value, page: 1 })
            }
          >
            <option value="">All Types</option>
            <option value="angel">Angel</option>
            <option value="vc">VC</option>
            <option value="corporate">Corporate</option>
            <option value="family_office">Family Office</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Date</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1 text-sm"
            value={search.dateFrom || ''}
            onChange={(e) =>
              updateSearch({ dateFrom: e.target.value, page: 1 })
            }
            placeholder="From"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1 text-sm"
            value={search.dateTo || ''}
            onChange={(e) => updateSearch({ dateTo: e.target.value, page: 1 })}
            placeholder="To"
          />
        </div>
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
                  No pending verifications.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {data.investors.length} of {data.pagination.total} investors
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: search.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
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
