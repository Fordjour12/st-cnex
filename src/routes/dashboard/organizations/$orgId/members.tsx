import { createFileRoute } from '@tanstack/react-router'
import { MemberList } from '@/components/organization/member-list'
import {
  useOrganizationMembers,
  useOrganizationInvitations,
} from '@/hooks/use-organization'

export const Route = createFileRoute('/dashboard/organizations/$orgId/members')(
  {
    component: MembersPage,
  },
)

function MembersPage() {
  const params = Route.useParams()
  const orgId = params.orgId
  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useOrganizationMembers(orgId)
  const {
    data: invitations,
    isLoading: invitesLoading,
    refetch: refetchInvites,
  } = useOrganizationInvitations(orgId)

  const handleChange = () => {
    refetchMembers()
    refetchInvites()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Members</h1>
      {membersLoading || invitesLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <MemberList
          organizationId={orgId}
          members={members}
          invitations={invitations}
          onChange={handleChange}
        />
      )}
    </div>
  )
}
