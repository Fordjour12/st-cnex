import { useQuery } from '@tanstack/react-query'
import { organization } from '@/lib/auth-client'

export function useListOrganizations() {
  return useQuery({
    queryKey: ['organizations', 'list'],
    queryFn: async () => {
      const result = await organization.list()
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}

export function useActiveOrganization() {
  return useQuery({
    queryKey: ['organizations', 'active'],
    queryFn: async () => {
      const result = await organization.getActiveOrganization()
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}

export function useOrganization(organizationId?: string) {
  return useQuery({
    queryKey: ['organizations', organizationId],
    queryFn: async () => {
      const result = await organization.getFullOrganization({
        organizationId,
      })
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    enabled: !!organizationId,
  })
}

export function useOrganizationMembers(organizationId?: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'members'],
    queryFn: async () => {
      const result = await organization.listMembers({
        organizationId,
      })
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    enabled: !!organizationId,
  })
}

export function useOrganizationTeams(organizationId?: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'teams'],
    queryFn: async () => {
      const result = await organization.listTeams({
        organizationId,
      })
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    enabled: !!organizationId,
  })
}

export function useOrganizationInvitations(organizationId?: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'invitations'],
    queryFn: async () => {
      const result = await organization.listInvitations({
        organizationId,
      })
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    enabled: !!organizationId,
  })
}

export function useUserInvitations() {
  return useQuery({
    queryKey: ['invitations', 'user'],
    queryFn: async () => {
      const result = await organization.listUserInvitations()
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}

export function useUserTeams() {
  return useQuery({
    queryKey: ['teams', 'user'],
    queryFn: async () => {
      const result = await organization.listUserTeams()
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}

export function useActiveMember() {
  return useQuery({
    queryKey: ['members', 'active'],
    queryFn: async () => {
      const result = await organization.getActiveMember()
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}

export function useHasPermission(permissions: Record<string, string[]>) {
  return useQuery({
    queryKey: ['permissions', permissions],
    queryFn: async () => {
      const result = await organization.hasPermission({
        permissions,
      })
      if (result.error) {
        throw result.error
      }
      return result.data
    },
  })
}
