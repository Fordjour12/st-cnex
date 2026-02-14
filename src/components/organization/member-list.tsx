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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export type Member = {
  id: string
  userId: string
  organizationId: string
  role: string
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export type Invitation = {
  id: string
  email: string
  organizationId: string
  role: string
  status: string
  expiresAt: Date
  createdAt: Date
}

interface MemberListProps {
  organizationId: string
  members?: Member[]
  invitations?: Invitation[]
  onChange?: () => void
}

const roleOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'coFounder', label: 'Co-Founder' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'employee', label: 'Employee' },
  { value: 'partner', label: 'Partner' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'associate', label: 'Associate' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'programManager', label: 'Program Manager' },
  { value: 'staff', label: 'Staff' },
]

export function MemberList({
  organizationId,
  members = [],
  invitations = [],
  onChange,
}: MemberListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsLoading(true)
    try {
      const result = await organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        organizationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to send invitation')
        return
      }

      toast.success('Invitation sent successfully')
      setInviteEmail('')
      setInviteRole('member')
      setIsSheetOpen(false)
      onChange?.()
    } catch {
      toast.error('An error occurred while sending invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const result = await organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to remove member')
        return
      }

      toast.success('Member removed successfully')
      onChange?.()
    } catch {
      toast.error('An error occurred while removing member')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const result = await organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to update role')
        return
      }

      toast.success('Role updated successfully')
      onChange?.()
    } catch {
      toast.error('An error occurred while updating role')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await organization.cancelInvitation({
        invitationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to cancel invitation')
        return
      }

      toast.success('Invitation cancelled')
      onChange?.()
    } catch {
      toast.error('An error occurred while cancelling invitation')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage members and invitations.</CardDescription>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger>
            <Button variant="outline" size="sm">
              Invite Member
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleInvite}>
              <SheetHeader>
                <SheetTitle>Invite Member</SheetTitle>
                <SheetDescription>
                  Send an invitation to join your organization.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => {
                      if (value) setInviteRole(value)
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {members.length === 0 && invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No members yet. Invite your first member to get started.
          </div>
        ) : (
          <>
            {members.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage
                              src={member.user?.image || undefined}
                            />
                            <AvatarFallback>
                              {member.user?.name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {member.user?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.user?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            if (value) handleUpdateRole(member.id, value)
                          }}
                          disabled={member.role === 'owner'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {invitations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">
                  Pending Invitations
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{invitation.role}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {invitation.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCancelInvitation(invitation.id)
                            }
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
