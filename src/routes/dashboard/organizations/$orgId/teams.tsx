import { createFileRoute } from '@tanstack/react-router'
import { TeamList } from '@/components/organization/team-list'
import { useOrganizationTeams } from '@/hooks/use-organization'

export const Route = createFileRoute('/dashboard/organizations/$orgId/teams')({
  component: TeamsPage,
})

function TeamsPage() {
  const params = Route.useParams()
  const orgId = params.orgId
  const { data: teams, isLoading, refetch } = useOrganizationTeams(orgId)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Teams</h1>
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <TeamList
          organizationId={orgId}
          teams={teams}
          onTeamsChange={() => refetch()}
        />
      )}
    </div>
  )
}
