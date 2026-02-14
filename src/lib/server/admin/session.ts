import { createServerFn } from '@tanstack/react-start'

import { requireAdminPermission } from '@/lib/server/admin/security'
import { RBACService } from '@/lib/server/rbac'

export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { user } = await requireAdminPermission()
      const isAdmin = await RBACService.isAdmin(user.id)
      return {
        authenticated: true as const,
        isAdmin,
        user,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''
      if (message !== 'UNAUTHORIZED') {
        throw error
      }

      return {
        authenticated: false as const,
        isAdmin: false as const,
        user: null,
      }
    }
  },
)
