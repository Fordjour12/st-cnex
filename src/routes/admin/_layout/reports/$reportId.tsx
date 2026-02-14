import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AdminAccessState } from '@/components/admin-access-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  getAdminReportById,
  resolveAdminReport,
  reviewAdminReport,
} from '@/lib/server/admin/reports'

export const Route = createFileRoute('/admin/_layout/reports/$reportId')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId)
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return { ok: false as const, reason: 'not_found' as const }
    }

    try {
      const data = await getAdminReportById({ data: { reportId } })
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
  component: ReportDetailPage,
})

function ReportDetailPage() {
  const loaderData = Route.useLoaderData()
  const params = Route.useParams()
  const router = useRouter()

  const [resolution, setResolution] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!loaderData.ok) {
    if (loaderData.reason === 'unauthorized') {
      return (
        <AdminAccessState
          title='Sign in required'
          description='You need to sign in to review reports.'
          ctaLabel='Go to sign in'
          ctaTo='/auth/sign-in'
        />
      )
    }

    if (loaderData.reason === 'forbidden') {
      return (
        <AdminAccessState
          title='Access denied'
          description='Your account does not have permission to review reports.'
          ctaLabel='Back to home'
          ctaTo='/'
        />
      )
    }

    return (
      <AdminAccessState
        title='Report not found'
        description='The requested report does not exist.'
        ctaLabel='Back to reports'
        ctaTo='/admin/reports'
      />
    )
  }

  const report = loaderData.data
  const reportId = Number(params.reportId)

  const runAction = async (fn: () => Promise<unknown>, successMessage: string) => {
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
        setActionError('Your session expired. Sign in again.')
      } else {
        setActionError('Action failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkReviewing = async () => {
    await runAction(
      async () => reviewAdminReport({ data: { reportId } }),
      'Report marked as reviewing.',
    )
  }

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (resolution.trim().length < 5) {
      setActionError('Resolution must be at least 5 characters.')
      return
    }

    await runAction(
      async () =>
        resolveAdminReport({
          data: {
            reportId,
            status,
            resolution: resolution.trim(),
          },
        }),
      `Report ${status}.`,
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Report #{report.id}</h1>
        <Link to='/admin/reports' className='text-sm text-primary hover:underline'>
          Back to Reports
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Detail label='Type' value={report.reportType} capitalize />
          <Detail label='Status' value={report.status} capitalize />
          <Detail label='Reported User' value={report.reportedUserId} mono />
          <Detail label='Reporter' value={report.reporterId || 'Anonymous'} mono />
          <Detail label='Reason' value={report.reason} />
          <Detail label='Description' value={report.description || '-'} />
          <Detail
            label='Created'
            value={new Date(report.createdAt).toLocaleString('en-US')}
          />
          <Detail
            label='Reviewed By'
            value={report.reviewedBy || '-'}
            mono={Boolean(report.reviewedBy)}
          />
          <Detail label='Resolution' value={report.resolution || '-'} />

          <div className='pt-2'>
            <Badge variant='secondary' className='capitalize'>
              {report.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {actionError ? <p className='text-sm text-destructive'>{actionError}</p> : null}
          {actionSuccess ? <p className='text-sm text-emerald-600'>{actionSuccess}</p> : null}

          <Button
            variant='outline'
            onClick={() => void handleMarkReviewing()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Mark Reviewing'}
          </Button>

          <Textarea
            placeholder='Resolution notes (required for resolve/dismiss)'
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
          />

          <div className='flex gap-2'>
            <Button
              onClick={() => void handleResolve('resolved')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Resolve'}
            </Button>
            <Button
              variant='destructive'
              onClick={() => void handleResolve('dismissed')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Dismiss'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string
  value: string
  mono?: boolean
  capitalize?: boolean
}) {
  return (
    <div>
      <p className='text-sm font-medium text-muted-foreground'>{label}</p>
      <p className={`text-sm ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  )
}
