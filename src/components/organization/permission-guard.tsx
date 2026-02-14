import { type ReactNode } from 'react'
import { useHasPermission, useActiveMember } from '@/hooks/use-organization'

interface PermissionGuardProps {
  children: ReactNode
  permissions: Record<string, string[]>
  fallback?: ReactNode
  requireAll?: boolean
}

export function PermissionGuard({
  children,
  permissions,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { data: hasPermission, isLoading } = useHasPermission(permissions)
  const { data: member } = useActiveMember()

  if (isLoading) {
    return null
  }

  if (!hasPermission || !member) {
    return <>{fallback}</>
  }

  const allowed = requireAll
    ? hasPermission.every((p: { access: boolean }) => p.access)
    : hasPermission.some((p: { access: boolean }) => p.access)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGuardProps {
  children: ReactNode
  roles: string[]
  fallback?: ReactNode
}

export function RoleGuard({
  children,
  roles,
  fallback = null,
}: RoleGuardProps) {
  const { data: member, isLoading } = useActiveMember()

  if (isLoading || !member) {
    return <>{fallback}</>
  }

  const userRoles = Array.isArray(member.role)
    ? member.role
    : member.role.split(',')

  const hasRole = roles.some((role) => userRoles.includes(role))

  if (!hasRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function requireRole(...roles: string[]) {
  return function RoleCheck({ children }: { children: ReactNode }) {
    return <RoleGuard roles={roles}>{children}</RoleGuard>
  }
}

export function requirePermission(
  permissions: Record<string, string[]>,
  requireAll = false,
) {
  return function PermissionCheck({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback?: ReactNode
  }) {
    return (
      <PermissionGuard
        permissions={permissions}
        requireAll={requireAll}
        fallback={fallback}
      >
        {children}
      </PermissionGuard>
    )
  }
}

export function IsOwner({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <RoleGuard roles={['owner']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function IsAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <RoleGuard roles={['owner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function CanManageMembers({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <RoleGuard roles={['owner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function CanManageTeams({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <RoleGuard roles={['owner', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function CanInviteMembers({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <RoleGuard roles={['owner', 'admin', 'member']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
