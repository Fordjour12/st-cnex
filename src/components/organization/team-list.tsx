'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { organization } from '@/lib/auth-client'

export type Team = {
  id: string
  name: string
  organizationId: string
  createdAt: Date
}

export type TeamMember = {
  id: string
  teamId: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  createdAt: Date
}

interface TeamListProps {
  organizationId: string
  teams?: Team[]
  onTeamsChange?: () => void
}

export function TeamList({
  organizationId,
  teams = [],
  onTeamsChange,
}: TeamListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setIsLoading(true)
    try {
      const result = await organization.createTeam({
        name: newTeamName,
        organizationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to create team')
        return
      }

      toast.success('Team created successfully')
      setNewTeamName('')
      setIsSheetOpen(false)
      onTeamsChange?.()
    } catch {
      toast.error('An error occurred while creating the team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return

    try {
      const result = await organization.removeTeam({
        teamId,
        organizationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to delete team')
        return
      }

      toast.success('Team deleted successfully')
      onTeamsChange?.()
    } catch {
      toast.error('An error occurred while deleting the team')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Manage teams within your organization.
          </CardDescription>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger>
            <Button variant="outline" size="sm">
              Add Team
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleCreateTeam}>
              <SheetHeader>
                <SheetTitle>Create Team</SheetTitle>
                <SheetDescription>
                  Create a new team to organize members.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Engineering"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No teams yet. Create your first team to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  onDelete={() => handleDeleteTeam(team.id)}
                  onMembersChange={onTeamsChange}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

interface TeamRowProps {
  team: Team
  onDelete: () => void
  onMembersChange?: () => void
}

function TeamRow({ team, onDelete, onMembersChange }: TeamRowProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const result = await organization.listTeamMembers({
        teamId: team.id,
      })
      if (!result.error) {
        setMembers(result.data || [])
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open)
    if (open) {
      loadMembers()
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{team.name}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(true)}
          >
            {isLoading
              ? 'Loading...'
              : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </Button>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </TableCell>
      </TableRow>

      <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{team.name} - Team Members</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {members.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No members in this team yet.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={member.user?.image || undefined} />
                        <AvatarFallback>
                          {member.user?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {member.user?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await organization.removeTeamMember({
                          teamId: team.id,
                          userId: member.userId,
                        })
                        loadMembers()
                        onMembersChange?.()
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
