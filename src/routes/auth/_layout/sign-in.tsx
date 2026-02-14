import { createFileRoute } from '@tanstack/react-router'
import Login from '@/components/login'

export const Route = createFileRoute('/auth/_layout/sign-in')({
   component: RouteComponent,
})

function RouteComponent() {
   return <Login />
}
