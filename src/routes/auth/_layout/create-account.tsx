import { createFileRoute } from '@tanstack/react-router'
import CreateAccount from '@/components/create-account'

export const Route = createFileRoute('/auth/_layout/create-account')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CreateAccount />
}
