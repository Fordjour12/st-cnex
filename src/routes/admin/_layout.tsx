import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getAdminSession } from '@/lib/server/admin/session'
import { DashboardSidebar } from '@/components/sidebar-03/app-sidebar'

export const Route = createFileRoute('/admin/_layout')({
  loader: async () => {
    const session = await getAdminSession()

    if (!session.authenticated) {
      throw redirect({ to: '/auth/sign-in' })
    }

    if (!session.isAdmin) {
      throw redirect({ to: '/' })
    }

    return { user: session.user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className='relative flex h-dvh w-full'>
        <DashboardSidebar />
        <SidebarInset className='flex flex-col'>
          <div className='flex-1 overflow-auto p-4'>
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
