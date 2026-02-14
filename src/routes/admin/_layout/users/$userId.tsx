import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { AdminAccessState } from '@/components/admin-access-state'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  getAdminSession,
  impersonateUser,
  listUserSessions,
  revokeAllUserSessions,
  revokeUserSession,
  stopImpersonating,
} from '@/lib/server/admin/session'
import {
  banAdminUser,
  deleteAdminUser,
  getAdminUserById,
  liftUserSuspension,
  setAdminUserPassword,
  setAdminUserRole,
  suspendAdminUser,
  updateAdminUser,
} from '@/lib/server/admin/users'

type AuthRole = 'admin' | 'user'
const AUTH_ROLE_OPTIONS: Array<AuthRole> = ['user', 'admin']

export const Route = createFileRoute('/admin/_layout/users/$userId')({
  loader: async ({ params }) => {
    try {
      const [data, sessions, adminSession] = await Promise.all([
        getAdminUserById({ data: { userId: params.userId } }),
        listUserSessions({ data: { userId: params.userId } }),
        getAdminSession(),
      ])

      return {
        ok: true as const,
        data,
        sessions,
        adminSession,
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

  const [activeTab, setActiveTab] = useState<'account' | 'sessions'>('account')

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Array<AuthRole>>([])
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

  const { user, profile, suspension, roles } = loaderData.data
  const sessions = loaderData.sessions.sessions
  const isImpersonating = loaderData.adminSession.impersonating

  const founder = profile.founder as { startupName?: string } | null | undefined
  const investor = profile.investor as { investorType?: string } | null | undefined
  const talent = profile.talent as { role?: string } | null | undefined
  const hasSuspension = Boolean(suspension as unknown)

  const authRoles = useMemo(
    () =>
      user.role
        .split(',')
        .map((role) => role.trim())
        .filter((role): role is AuthRole => role === 'user' || role === 'admin'),
    [user.role],
  )

  useEffect(() => {
    setEditName(user.name)
    setEditEmail(user.email)
    setSelectedRoles(authRoles)
  }, [authRoles, user.email, user.name])

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
        setActionError(message || 'Action failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleRole = (role: AuthRole, checked: boolean) => {
    setSelectedRoles((prev) => {
      if (checked) {
        return prev.includes(role) ? prev : [...prev, role]
      }
      return prev.filter((current) => current !== role)
    })
  }

  const handleUpdateUser = async () => {
    if (!editName.trim()) {
      setActionError('Name is required.')
      return
    }

    if (!editEmail.trim()) {
      setActionError('Email is required.')
      return
    }

    await runAction(
      async () =>
        updateAdminUser({
          data: {
            userId: user.id,
            name: editName.trim(),
            email: editEmail.trim(),
          },
        }),
      'User details updated.',
    )
  }

  const handlePasswordReset = async () => {
    if (newPassword.length < 8) {
      setActionError('New password must be at least 8 characters.')
      return
    }

    await runAction(
      async () =>
        setAdminUserPassword({
          data: {
            userId: user.id,
            newPassword,
          },
        }),
      'Password updated successfully.',
    )

    setNewPassword('')
  }

  const handleAssignRoles = async () => {
    if (selectedRoles.length === 0) {
      setActionError('Select at least one role.')
      return
    }

    await runAction(
      async () =>
        setAdminUserRole({
          data: {
            userId: user.id,
            role: selectedRoles,
          },
        }),
      'User roles updated successfully.',
    )
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
        <div className='flex items-center gap-3'>
          {isImpersonating ? <Badge variant='secondary'>Impersonation Active</Badge> : null}
          <Link
            to='/admin/users'
            search={{
              page: 1,
              limit: 20,
              search: '',
              role: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
            }}
            className='text-sm text-primary hover:underline'
          >
            Back to Users
          </Link>
        </div>
      </div>

      {actionError ? <p className='text-sm text-destructive'>{actionError}</p> : null}
      {actionSuccess ? <p className='text-sm text-emerald-600'>{actionSuccess}</p> : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'account' | 'sessions')}>
        <TabsList>
          <TabsTrigger value='account'>Account</TabsTrigger>
          <TabsTrigger value='sessions'>Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value='account' className='space-y-6'>
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
                  <label className='text-sm font-medium text-muted-foreground'>Status</label>
                  <div className='mt-1 flex gap-2'>
                    <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                    {user.banned ? <Badge variant='destructive'>Banned</Badge> : null}
                    {hasSuspension ? <Badge variant='outline'>Suspended</Badge> : null}
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Auth Roles</label>
                  <div className='mt-1 flex flex-wrap gap-2'>
                    {authRoles.map((role) => (
                      <Badge key={role} variant='outline'>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium text-muted-foreground'>RBAC Roles</label>
                  <div className='mt-1 flex flex-wrap gap-2'>
                    {roles.length ? (
                      roles.map((role) => (
                        <Badge key={role} variant='outline'>
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <p className='text-sm text-muted-foreground'>No RBAC role assigned</p>
                    )}
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
              <CardTitle>User Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2 rounded-md border p-4'>
                  <h3 className='text-sm font-semibold'>Edit User</h3>
                  <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder='Full name' />
                  <Input value={editEmail} onChange={(event) => setEditEmail(event.target.value)} placeholder='Email' />
                  <Button variant='outline' disabled={isSubmitting} onClick={() => void handleUpdateUser()}>
                    {isSubmitting ? 'Processing...' : 'Save User'}
                  </Button>
                </div>

                <div className='space-y-2 rounded-md border p-4'>
                  <h3 className='text-sm font-semibold'>Reset Password</h3>
                  <Input
                    type='password'
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder='New password (min 8 chars)'
                  />
                  <Button variant='outline' disabled={isSubmitting} onClick={() => void handlePasswordReset()}>
                    {isSubmitting ? 'Processing...' : 'Set Password'}
                  </Button>
                </div>
              </div>

              <div className='space-y-2 rounded-md border p-4'>
                <h3 className='text-sm font-semibold'>Assign Roles (Multiple)</h3>
                <div className='grid gap-2 md:grid-cols-3'>
                  {AUTH_ROLE_OPTIONS.map((role) => (
                    <label key={role} className='flex items-center gap-2 text-sm'>
                      <Checkbox
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={(checked) => toggleRole(role, Boolean(checked))}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                <Button variant='outline' disabled={isSubmitting} onClick={() => void handleAssignRoles()}>
                  {isSubmitting ? 'Processing...' : 'Update Roles'}
                </Button>
              </div>

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
                  <Button variant='outline' onClick={() => void handleSuspend()} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Suspend'}
                  </Button>
                  {hasSuspension ? (
                    <Button variant='secondary' onClick={() => void handleLiftSuspension()} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Lift Suspension'}
                    </Button>
                  ) : null}
                </div>

                <div className='space-y-2 rounded-md border p-4'>
                  <h3 className='text-sm font-semibold'>Ban User</h3>
                  <Textarea
                    placeholder='Reason for ban (min 10 chars)'
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                  />
                  <Button variant='destructive' onClick={() => void handleBan()} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Ban'}
                  </Button>
                </div>
              </div>

              <div className='rounded-md border p-4'>
                <h3 className='text-sm font-semibold'>Delete User</h3>
                <p className='mt-1 text-sm text-muted-foreground'>This will permanently remove the user account and all sessions.</p>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button variant='destructive' className='mt-3'>Delete User</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. It will permanently delete the user and all related sessions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant='destructive'
                        onClick={() =>
                          void runAction(
                            async () =>
                              deleteAdminUser({
                                data: {
                                  userId: user.id,
                                },
                              }),
                            'User deleted successfully.',
                          )
                        }
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='sessions' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  disabled={isSubmitting}
                  onClick={() =>
                    void runAction(
                      async () =>
                        revokeAllUserSessions({
                          data: { userId: user.id },
                        }),
                      'All sessions revoked.',
                    )
                  }
                >
                  Revoke All Sessions
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button disabled={isSubmitting}>Impersonate User</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Impersonate this user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be signed in as this user until you stop impersonating.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          void runAction(
                            async () =>
                              impersonateUser({
                                data: {
                                  userId: user.id,
                                },
                              }),
                            'Impersonation started.',
                          )
                        }
                      >
                        Start Impersonation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {isImpersonating ? (
                  <Button
                    variant='secondary'
                    disabled={isSubmitting}
                    onClick={() => void runAction(async () => stopImpersonating(), 'Stopped impersonating.')}
                  >
                    Stop Impersonating
                  </Button>
                ) : null}
              </div>

              <div className='space-y-2'>
                {sessions.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>No active sessions found.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className='rounded-md border p-3'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='space-y-1'>
                          <p className='text-sm font-medium'>
                            {session.ipAddress ?? 'Unknown IP'}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {session.userAgent ?? 'Unknown device'}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Last active:{' '}
                            {new Date(session.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          disabled={isSubmitting}
                          onClick={() =>
                            void runAction(
                              async () =>
                                revokeUserSession({
                                  data: {
                                    sessionToken: session.token,
                                  },
                                }),
                              'Session revoked.',
                            )
                          }
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
