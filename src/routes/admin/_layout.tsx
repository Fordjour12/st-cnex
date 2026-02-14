import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { RBACService } from '@/lib/server/rbac'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/sidebar-03/app-sidebar'
{/*loader: async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw redirect({ to: '/auth/sign-in' })
    }

    const isAdmin = await RBACService.isAdmin(session.user.id)

    if (!isAdmin) {
      throw redirect({ to: '/' })
    }

    return { user: session.user }
  },*/

export const Route = createFileRoute('/admin/_layout')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="relative flex h-dvh w-full">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col" />
      </div>
    </SidebarProvider>
  )
}
