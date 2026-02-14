import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/_layout/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/_layout/reset-password"!</div>
}
