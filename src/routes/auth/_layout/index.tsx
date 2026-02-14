import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/_layout/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1>Hii you not suppose to be back here </h1>

      <div className="pt-6">
        <Button className="py-4">
          <Link to="/auth/sign-in">Sign In To Account</Link>
        </Button>
      </div>
    </div>
  )
}
