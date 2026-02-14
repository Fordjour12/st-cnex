import Login04 from '@/components/login'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/_layout/sign-in')({
   component: RouteComponent,
})

function RouteComponent() {
   return (
      <Login04 />
   )


}
