import { createFileRoute } from '@tanstack/react-router'
import { UserService } from '@/lib/server/user'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/admin/_layout/users/$userId')({
  loader: async ({ params }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const user = await UserService.getUserById(params.userId)
    const profile = await UserService.getUserProfile(params.userId)
    const suspension = await UserService.getUserSuspension(params.userId)

    return { user, profile, suspension }
  },
  component: UserDetailPage,
})

interface UserData {
  user: {
    id: string
    email: string
    name: string | null
    createdAt: Date
    emailVerified: boolean
    banned: boolean | null
  } | null
  profile: {
    founder: Record<string, unknown> | null
    investor: Record<string, unknown> | null
    talent: Record<string, unknown> | null
  }
  suspension: Record<string, unknown> | null
}

function UserDetailPage() {
  const data = Route.useLoaderData() as unknown as UserData

  if (!data.user) {
    return <div>User not found</div>
  }

  const { user, profile, suspension } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Details</h1>
        <a
          href="/admin/users"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Users
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-sm">{user.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Joined
              </label>
              <p className="text-sm">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="flex gap-2 mt-1">
                <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
                {user.banned && <Badge variant="destructive">Banned</Badge>}
                {suspension && <Badge variant="outline">Suspended</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.founder ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <p className="text-sm">Founder</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Startup
                  </label>
                  <p className="text-sm">
                    {profile.founder.startupName || '-'}
                  </p>
                </div>
              </>
            ) : profile.investor ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <p className="text-sm">Investor</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Investor Type
                  </label>
                  <p className="text-sm">
                    {profile.investor.investorType || '-'}
                  </p>
                </div>
              </>
            ) : profile.talent ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <p className="text-sm">Talent</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <p className="text-sm">{profile.talent.role || '-'}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No profile created yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">Suspend User</Button>
          <Button variant="destructive">Ban User</Button>
          {suspension && <Button variant="secondary">Lift Suspension</Button>}
        </CardContent>
      </Card>
    </div>
  )
}
