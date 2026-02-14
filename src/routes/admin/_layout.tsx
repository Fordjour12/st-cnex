import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getAdminSession } from '@/lib/server/admin/session'
import { DashboardSidebar } from '@/components/sidebar-03/app-sidebar'
import { AnalyticsService } from '@/lib/server/analytics'

export const Route = createFileRoute('/admin/_layout')({
  loader: async () => {
    const session = await getAdminSession()

    if (!session.authenticated) {
      throw redirect({ to: '/auth/sign-in' })
    }

    if (!session.isAdmin) {
      throw redirect({ to: '/' })
    }

    const [pendingVerifications, pendingReports] = await Promise.all([
      AnalyticsService.getPendingVerifications(),
      AnalyticsService.getPendingReports(),
    ])

    return {
      ...session,
      pendingVerifications,
      pendingReports,
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const session = Route.useLoaderData()

  return (
    <SidebarProvider>
      <div className="relative flex h-dvh w-full">
        <DashboardSidebar
          pendingVerifications={session.pendingVerifications}
          pendingReports={session.pendingReports}
        />
        <SidebarInset className="flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            {session.impersonating ? (
              <div className="mb-3">
                <Badge variant="secondary">Impersonation Active</Badge>
              </div>
            ) : null}
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
