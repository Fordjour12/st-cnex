import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { RBACService } from '@/lib/server/rbac'

export const Route = createFileRoute('/admin/_layout')({
  loader: async () => {
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
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>
        <nav className="space-y-2">
          <a
            href="/admin"
            className="block py-2 px-4 rounded hover:bg-gray-800"
          >
            Overview
          </a>
          <a
            href="/admin/users"
            className="block py-2 px-4 rounded hover:bg-gray-800"
          >
            Users
          </a>
          <a
            href="/admin/reports"
            className="block py-2 px-4 rounded hover:bg-gray-800"
          >
            Reports
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
