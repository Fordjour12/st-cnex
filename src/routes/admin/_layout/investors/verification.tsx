import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { db } from '@/db'
import { investorProfiles } from '@/db/schema/profile'
import { user } from '@/db/schema/auth'
import { eq, desc } from 'drizzle-orm'
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

export const Route = createFileRoute('/admin/_layout/investors/verification')({
  loader: async () => {
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

    const investors = await db
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
      .orderBy(desc(investorProfiles.createdAt))
      .limit(50)

    return { investors }
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

function InvestorVerificationPage() {
  const data = Route.useLoaderData() as unknown as { investors: Investor[] }
  const router = useRouter()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

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
    </div>
  )
}
