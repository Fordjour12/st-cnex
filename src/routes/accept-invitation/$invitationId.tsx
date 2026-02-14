import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { organization, authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/accept-invitation/$invitationId')({
  component: AcceptInvitationPage,
  loader: async ({ params }) => {
    const result = await organization.getInvitation({
      id: params.invitationId,
    })
    return { invitation: result.data, error: result.error }
  },
})

function AcceptInvitationPage() {
  const params = Route.useParams()
  const search = useSearch({ from: '/accept-invitation/$invitationId' })
  const [isLoading, setIsLoading] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const result = await organization.acceptInvitation({
        invitationId: params.invitationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to accept invitation')
        return
      }

      toast.success('Invitation accepted!')
      window.location.href = '/dashboard'
    } catch {
      toast.error('An error occurred while accepting the invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const result = await organization.rejectInvitation({
        invitationId: params.invitationId,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to reject invitation')
        return
      }

      toast.success('Invitation rejected')
      window.location.href = '/'
    } catch {
      toast.error('An error occurred while rejecting the invitation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You have been invited to join an organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click below to accept or reject this invitation.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReject}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? 'Accepting...' : 'Accept'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
