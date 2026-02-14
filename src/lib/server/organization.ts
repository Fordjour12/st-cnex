import { createServerFn } from '@tanstack/react-start/server'

import { auth } from '@/lib/auth'
import type { OrganizationType } from '@/lib/auth-client'

function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie')
  return cookieHeader?.match(/better-auth\.session_token=([^;]+)/)?.[1]
}

function getSessionHeaders(request: Request): Record<string, string> {
  const token = getSessionToken(request)
  if (!token) {
    throw new Error('Not authenticated')
  }
  return {
    cookie: `better-auth.session_token=${token}`,
  }
}

export type CreateOrganizationData = {
  name: string
  slug: string
  type: OrganizationType
  logo?: string
  metadata?: Record<string, unknown>
}

export const createOrganization = createServerFn({
  method: 'POST',
})
  .validator((data: CreateOrganizationData) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const organization = await auth.api.createOrganization({
      headers,
      body: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        metadata: {
          ...data.metadata,
          type: data.type,
        } as Record<string, unknown>,
      },
    })

    return organization
  })

export const listOrganizations = createServerFn({
  method: 'GET',
}).handler(async ({ request }) => {
  const headers = getSessionHeaders(request)

  const organizations = await auth.api.listOrganizations({
    headers,
  })

  return organizations
})

export const getFullOrganization = createServerFn({
  method: 'GET',
})
  .validator(
    (data: { organizationId?: string; organizationSlug?: string }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const organization = await auth.api.getFullOrganization({
      headers,
      query: {
        organizationId: data.organizationId,
        organizationSlug: data.organizationSlug,
      },
    })

    return organization
  })

export const updateOrganization = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      organizationId: string
      name?: string
      slug?: string
      logo?: string
    }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const organization = await auth.api.updateOrganization({
      headers,
      body: {
        organizationId: data.organizationId,
        data: {
          name: data.name,
          slug: data.slug,
          logo: data.logo,
        },
      },
    })

    return organization
  })

export const deleteOrganization = createServerFn({
  method: 'POST',
})
  .validator((data: { organizationId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.deleteOrganization({
      headers,
      body: {
        organizationId: data.organizationId,
      },
    })

    return { success: true }
  })

export const setActiveOrganization = createServerFn({
  method: 'POST',
})
  .validator((data: { organizationId?: string | null }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.setActiveOrganization({
      headers,
      body: {
        organizationId: data.organizationId,
      },
    })

    return result
  })

export const getActiveOrganization = createServerFn({
  method: 'GET',
}).handler(async ({ request }) => {
  const headers = getSessionHeaders(request)

  const session = await auth.api.getSession({ headers })

  if (!session || !session.activeOrganizationId) {
    return { organization: null }
  }

  const organization = await auth.api.getFullOrganization({
    headers,
    query: {
      organizationId: session.activeOrganizationId,
    },
  })

  return { organization }
})

export const createTeam = createServerFn({
  method: 'POST',
})
  .validator((data: { name: string; organizationId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const team = await auth.api.createTeam({
      headers,
      body: {
        name: data.name,
        organizationId: data.organizationId,
      },
    })

    return team
  })

export const listTeams = createServerFn({
  method: 'GET',
})
  .validator((data?: { organizationId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const teams = await auth.api.listOrganizationTeams({
      headers,
      query: {
        organizationId: data?.organizationId,
      },
    })

    return teams
  })

export const updateTeam = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { teamId: string; name: string; organizationId?: string }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const team = await auth.api.updateTeam({
      headers,
      body: {
        teamId: data.teamId,
        data: {
          name: data.name,
        },
        organizationId: data.organizationId,
      },
    })

    return team
  })

export const deleteTeam = createServerFn({
  method: 'POST',
})
  .validator((data: { teamId: string; organizationId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.removeTeam({
      headers,
      body: {
        teamId: data.teamId,
        organizationId: data.organizationId,
      },
    })

    return { success: true }
  })

export const setActiveTeam = createServerFn({
  method: 'POST',
})
  .validator((data: { teamId?: string | null }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.setActiveTeam({
      headers,
      body: {
        teamId: data.teamId,
      },
    })

    return result
  })

export const listUserTeams = createServerFn({
  method: 'GET',
}).handler(async ({ request }) => {
  const headers = getSessionHeaders(request)

  const teams = await auth.api.listUserTeams({
    headers,
  })

  return teams
})

export const inviteMember = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      email: string
      role: string | string[]
      organizationId?: string
      teamId?: string
    }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const invitation = await auth.api.createInvitation({
      headers,
      body: {
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        teamId: data.teamId,
      },
    })

    return invitation
  })

export const acceptInvitation = createServerFn({
  method: 'POST',
})
  .validator((data: { invitationId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.acceptInvitation({
      headers,
      body: {
        invitationId: data.invitationId,
      },
    })

    return result
  })

export const listInvitations = createServerFn({
  method: 'GET',
})
  .validator((data?: { organizationId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const invitations = await auth.api.listInvitations({
      headers,
      query: {
        organizationId: data?.organizationId,
      },
    })

    return invitations
  })

export const cancelInvitation = createServerFn({
  method: 'POST',
})
  .validator((data: { invitationId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.cancelInvitation({
      headers,
      body: {
        invitationId: data.invitationId,
      },
    })

    return { success: true }
  })

export const listMembers = createServerFn({
  method: 'GET',
})
  .validator((data?: { organizationId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const members = await auth.api.listMembers({
      headers,
      query: {
        organizationId: data?.organizationId,
      },
    })

    return members
  })

export const updateMemberRole = createServerFn({
  method: 'POST',
})
  .validator(
    (data: {
      memberId: string
      role: string | string[]
      organizationId?: string
    }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.updateMemberRole({
      headers,
      body: {
        memberId: data.memberId,
        role: data.role,
        organizationId: data.organizationId,
      },
    })

    return { success: true }
  })

export const removeMember = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { memberIdOrEmail: string; organizationId?: string }) => data,
  )
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.removeMember({
      headers,
      body: {
        memberIdOrEmail: data.memberIdOrEmail,
        organizationId: data.organizationId,
      },
    })

    return { success: true }
  })

export const leaveOrganization = createServerFn({
  method: 'POST',
})
  .validator((data: { organizationId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.leaveOrganization({
      headers,
      body: {
        organizationId: data.organizationId,
      },
    })

    return { success: true }
  })

export const addTeamMember = createServerFn({
  method: 'POST',
})
  .validator((data: { teamId: string; userId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.addTeamMember({
      headers,
      body: {
        teamId: data.teamId,
        userId: data.userId,
      },
    })

    return result
  })

export const removeTeamMember = createServerFn({
  method: 'POST',
})
  .validator((data: { teamId: string; userId: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    await auth.api.removeTeamMember({
      headers,
      body: {
        teamId: data.teamId,
        userId: data.userId,
      },
    })

    return { success: true }
  })

export const listTeamMembers = createServerFn({
  method: 'GET',
})
  .validator((data?: { teamId?: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const members = await auth.api.listTeamMembers({
      headers,
      query: {
        teamId: data?.teamId,
      },
    })

    return members
  })

export const checkOrganizationSlug = createServerFn({
  method: 'GET',
})
  .validator((data: { slug: string }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.checkOrganizationSlug({
      headers,
      body: {
        slug: data.slug,
      },
    })

    return result
  })

export const getActiveMember = createServerFn({
  method: 'GET',
}).handler(async ({ request }) => {
  const headers = getSessionHeaders(request)

  const member = await auth.api.getActiveMember({
    headers,
  })

  return member
})

export const hasPermission = createServerFn({
  method: 'POST',
})
  .validator((data: { permissions: Record<string, string[]> }) => data)
  .handler(async ({ data, request }) => {
    const headers = getSessionHeaders(request)

    const result = await auth.api.hasPermission({
      headers,
      body: {
        permissions: data.permissions,
      },
    })

    return result
  })
