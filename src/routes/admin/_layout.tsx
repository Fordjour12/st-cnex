import { Outlet, createFileRoute } from '@tanstack/react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DashboardSidebar } from '@/components/sidebar-03/app-sidebar'

export const Route = createFileRoute('/admin/_layout')({
  loader: async () => ({}),
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
