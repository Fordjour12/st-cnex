import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { auth } from '@/lib/auth'
import {
  calculateUserRisk,
  createAnnouncement,
  createFraudFlag,
  evaluateModerationRules,
  initializePhase4Defaults,
  issueUserWarning,
  resolveFraudFlag,
  upsertEmailTemplate,
  upsertFeatureToggle,
  upsertSystemSetting,
} from '@/lib/server/admin/moderation-and-system'
import { AnalyticsService } from '@/lib/server/analytics'
import {
  Phase4ModerationService,
  Phase4SystemService,
} from '@/lib/server/moderation-and-system'

export const Route = createFileRoute('/admin/_layout/')({
  loader: async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const [
      stats,
      verificationStats,
      newSignups7d,
      newSignups30d,
      moderation,
      system,
    ] = await Promise.all([
      AnalyticsService.getPlatformStats(),
      AnalyticsService.getInvestorVerificationStats(),
      AnalyticsService.getNewSignups({ days: 7 }),
      AnalyticsService.getNewSignups({ days: 30 }),
      Phase4ModerationService.getModerationOverview(),
      Phase4SystemService.getSystemOverview(),
    ])

    return {
      stats,
      verificationStats,
      newSignups7d,
      newSignups30d,
      moderation,
      system,
    }
  },
  component: AdminDashboard,
})

interface Stats {
  totalUsers: number
  totalFounders: number
  totalInvestors: number
  totalTalent: number
  pendingReports: number
  verifiedInvestors: number
}

interface LoaderData {
  stats: Stats
  verificationStats: Array<{ status: string; count: number }>
  newSignups7d: number
  newSignups30d: number
  moderation: Awaited<ReturnType<typeof Phase4ModerationService.getModerationOverview>>
  system: Awaited<ReturnType<typeof Phase4SystemService.getSystemOverview>>
}

function AdminDashboard() {
  const data = Route.useLoaderData() as unknown as LoaderData
  const router = useRouter()
  const { stats, verificationStats, newSignups7d, moderation, system } = data

  const pendingVerifications =
    verificationStats.find((v) => v.status === 'pending')?.count ?? 0

  const [userId, setUserId] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [settingKey, setSettingKey] = useState('')
  const [settingValue, setSettingValue] = useState('')
  const [toggleKey, setToggleKey] = useState('')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBody, setTemplateBody] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      await action()
      setStatus(successMessage)
      await router.invalidate()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-6 p-6'>
      <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
      {status ? <p className='text-sm text-emerald-600'>{status}</p> : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Total Users' value={stats.totalUsers} note={`+${newSignups7d} this week`} />
        <StatCard title='Pending Reports' value={stats.pendingReports} note='Needs review' />
        <StatCard title='Pending Verifications' value={pendingVerifications} note='Investor queue' />
        <StatCard title='Open Fraud Flags' value={moderation.stats.openFlags} note='Phase 4 moderation' />
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Phase 4: Advanced Moderation</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              High-risk users: {moderation.stats.highRiskUsers}
            </p>
            <Input
              placeholder='Target User ID'
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                disabled={busy || !userId}
                onClick={() =>
                  void run(
                    () => calculateUserRisk({ data: { userId } }),
                    'Risk score calculated.',
                  )
                }
              >
                Calculate Risk
              </Button>
              <Button
                variant='outline'
                disabled={busy || !userId}
                onClick={() =>
                  void run(
                    () => evaluateModerationRules({ data: { userId } }),
                    'Moderation rules evaluated.',
                  )
                }
              >
                Run Rules
              </Button>
            </div>

            <Textarea
              placeholder='Warning message'
              value={warningMessage}
              onChange={(event) => setWarningMessage(event.target.value)}
            />
            <Button
              variant='outline'
              disabled={busy || !userId || warningMessage.length < 5}
              onClick={() =>
                void run(
                  () =>
                    issueUserWarning({
                      data: {
                        userId,
                        warningType: 'policy',
                        message: warningMessage,
                      },
                    }),
                  'Warning issued.',
                )
              }
            >
              Issue Warning
            </Button>

            <Textarea
              placeholder='Fraud flag reason'
              value={flagReason}
              onChange={(event) => setFlagReason(event.target.value)}
            />
            <Button
              disabled={busy || !userId || flagReason.length < 5}
              onClick={() =>
                void run(
                  () =>
                    createFraudFlag({
                      data: {
                        userId,
                        flagType: 'manual_review',
                        reason: flagReason,
                        severity: 3,
                      },
                    }),
                  'Fraud flag created.',
                )
              }
            >
              Create Fraud Flag
            </Button>

            <div className='space-y-2'>
              <p className='text-sm font-medium'>Recent Flags</p>
              {moderation.recentFlags.map((flag) => (
                <div key={flag.id} className='flex items-center justify-between rounded border p-2 text-sm'>
                  <span>
                    #{flag.id} {flag.userId} ({flag.status})
                  </span>
                  {flag.status !== 'resolved' ? (
                    <Button
                      variant='outline'
                      onClick={() =>
                        void run(
                          () => resolveFraudFlag({ data: { flagId: flag.id } }),
                          'Fraud flag resolved.',
                        )
                      }
                    >
                      Resolve
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 4: System Management</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() =>
                void run(() => initializePhase4Defaults(), 'Phase 4 defaults initialized.')
              }
            >
              Initialize Defaults
            </Button>

            <Input
              placeholder='Setting key'
              value={settingKey}
              onChange={(event) => setSettingKey(event.target.value)}
            />
            <Input
              placeholder='Setting value'
              value={settingValue}
              onChange={(event) => setSettingValue(event.target.value)}
            />
            <Button
              variant='outline'
              disabled={busy || !settingKey}
              onClick={() =>
                void run(
                  () =>
                    upsertSystemSetting({
                      data: {
                        key: settingKey,
                        value: settingValue,
                      },
                    }),
                  'System setting saved.',
                )
              }
            >
              Save Setting
            </Button>

            <Input
              placeholder='Feature toggle key'
              value={toggleKey}
              onChange={(event) => setToggleKey(event.target.value)}
            />
            <Button
              variant='outline'
              disabled={busy || !toggleKey}
              onClick={() =>
                void run(
                  () =>
                    upsertFeatureToggle({
                      data: {
                        key: toggleKey,
                        enabled: true,
                        rolloutPercentage: 100,
                      },
                    }),
                  'Feature toggle enabled.',
                )
              }
            >
              Enable Toggle
            </Button>

            <Input
              placeholder='Announcement title'
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
            />
            <Textarea
              placeholder='Announcement message'
              value={announcementMessage}
              onChange={(event) => setAnnouncementMessage(event.target.value)}
            />
            <Button
              disabled={busy || announcementTitle.length < 3 || announcementMessage.length < 5}
              onClick={() =>
                void run(
                  () =>
                    createAnnouncement({
                      data: {
                        title: announcementTitle,
                        message: announcementMessage,
                        type: 'info',
                      },
                    }),
                  'Announcement created.',
                )
              }
            >
              Create Announcement
            </Button>

            <Input
              placeholder='Template key'
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
            />
            <Input
              placeholder='Template subject'
              value={templateSubject}
              onChange={(event) => setTemplateSubject(event.target.value)}
            />
            <Textarea
              placeholder='Template body'
              value={templateBody}
              onChange={(event) => setTemplateBody(event.target.value)}
            />
            <Button
              disabled={busy || templateKey.length < 2 || templateBody.length < 5}
              onClick={() =>
                void run(
                  () =>
                    upsertEmailTemplate({
                      data: {
                        key: templateKey,
                        subject: templateSubject || 'Default Subject',
                        body: templateBody,
                      },
                    }),
                  'Email template saved.',
                )
              }
            >
              Save Template
            </Button>

            <div className='rounded border p-2 text-sm text-muted-foreground'>
              <p>Settings: {system.settings.length}</p>
              <p>Toggles: {system.toggles.length}</p>
              <p>Announcements: {system.announcements.length}</p>
              <p>Templates: {system.templates.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  note,
}: {
  title: string
  value: number
  note: string
}) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground'>{note}</p>
      </CardContent>
    </Card>
  )
}
