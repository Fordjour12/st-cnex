import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AdminAccessState } from '@/components/admin-access-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  banAdminUser,
  getAdminUserById,
  liftUserSuspension,
  suspendAdminUser,
} from '@/lib/server/admin/users'

export const Route = createFileRoute('/admin/_layout/users/$userId')({
  loader: async ({ params }) => {
    try {
      const data = await getAdminUserById({ data: { userId: params.userId } })

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
  component: UserDetailPage,
})

function UserDetailPage() {
  const loaderData = Route.useLoaderData()
  const router = useRouter()

  const [suspendReason, setSuspendReason] = useState('')
  const [suspendUntil, setSuspendUntil] = useState('')
  const [banReason, setBanReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!loaderData.ok) {
    if (loaderData.reason === 'unauthorized') {
      return (
        <AdminAccessState
          title='Sign in required'
          description='You need to sign in to view user details.'
          ctaLabel='Go to sign in'
          ctaTo='/auth/sign-in'
        />
      )
    }

    return (
      <AdminAccessState
        title='Access denied'
        description='Your account does not have permission to view user details.'
        ctaLabel='Back to home'
        ctaTo='/'
      />
    )
  }

  const { user, profile, suspension } = loaderData.data
  const founder = profile.founder as { startupName?: string } | null | undefined
  const investor = profile.investor as { investorType?: string } | null | undefined
  const talent = profile.talent as { role?: string } | null | undefined
  const hasSuspension = Boolean(suspension as unknown)

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
        setActionError('Your session has expired. Sign in again.')
      } else {
        setActionError('Action failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuspend = async () => {
    if (suspendReason.trim().length < 10) {
      setActionError('Suspend reason must be at least 10 characters.')
      return
    }

    await runAction(
      async () =>
        suspendAdminUser({
          data: {
            userId: user.id,
            reason: suspendReason.trim(),
            expiresAt: suspendUntil ? new Date(suspendUntil) : undefined,
          },
        }),
      'User suspended successfully.',
    )
  }

  const handleBan = async () => {
    if (banReason.trim().length < 10) {
      setActionError('Ban reason must be at least 10 characters.')
      return
    }

    await runAction(
      async () =>
        banAdminUser({
          data: {
            userId: user.id,
            reason: banReason.trim(),
          },
        }),
      'User banned successfully.',
    )
  }

  const handleLiftSuspension = async () => {
    await runAction(
      async () =>
        liftUserSuspension({
          data: {
            userId: user.id,
          },
        }),
      'Suspension lifted successfully.',
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>User Details</h1>
        <Link to='/admin/users' className='text-sm text-primary hover:underline'>
          Back to Users
        </Link>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <InfoRow label='Email' value={user.email} />
            <InfoRow label='Name' value={user.name || '-'} />
            <InfoRow label='User ID' value={user.id} mono />
            <InfoRow
              label='Joined'
              value={new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />

            <div>
              <label className='text-sm font-medium text-muted-foreground'>
                Status
              </label>
              <div className='mt-1 flex gap-2'>
                <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
                {user.banned && <Badge variant='destructive'>Banned</Badge>}
                {hasSuspension ? <Badge variant='outline'>Suspended</Badge> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {founder ? (
              <>
                <InfoRow label='Type' value='Founder' />
                <InfoRow label='Startup' value={founder.startupName || '-'} />
              </>
            ) : investor ? (
              <>
                <InfoRow label='Type' value='Investor' />
                <InfoRow label='Investor Type' value={investor.investorType || '-'} />
              </>
            ) : talent ? (
              <>
                <InfoRow label='Type' value='Talent' />
                <InfoRow label='Role' value={talent.role || '-'} />
              </>
            ) : (
              <p className='text-sm text-muted-foreground'>No profile created yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {actionError && <p className='text-sm text-destructive'>{actionError}</p>}
          {actionSuccess && <p className='text-sm text-emerald-600'>{actionSuccess}</p>}

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2 rounded-md border p-4'>
              <h3 className='text-sm font-semibold'>Suspend User</h3>
              <Textarea
                placeholder='Reason for suspension (min 10 chars)'
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
              />
              <Input
                type='datetime-local'
                value={suspendUntil}
                onChange={(event) => setSuspendUntil(event.target.value)}
              />
              <Button
                variant='outline'
                onClick={() => void handleSuspend()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Suspend'}
              </Button>
            </div>

            <div className='space-y-2 rounded-md border p-4'>
              <h3 className='text-sm font-semibold'>Ban User</h3>
              <Textarea
                placeholder='Reason for ban (min 10 chars)'
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
              />
              <Button
                variant='destructive'
                onClick={() => void handleBan()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Ban'}
              </Button>
            </div>
          </div>

          {hasSuspension ? (
            <Button
              variant='secondary'
              onClick={() => void handleLiftSuspension()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Lift Suspension'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <label className='text-sm font-medium text-muted-foreground'>{label}</label>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
