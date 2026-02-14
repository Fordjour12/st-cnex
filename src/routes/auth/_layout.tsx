import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="relative container grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 z-0">
          <img
            src="/gm-g-img-2.png"
            alt="Startup networking illustration"
            className="h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.svg" alt="Logo" className="mr-2 h-8 w-8" />
          StartupConnect
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "This platform has transformed how we connect with startups. The
              seamless integration and powerful features have made our
              investment process more efficient than ever."
            </p>
            <footer className="text-sm">
              Sofia Davis, Investment Director
            </footer>
          </blockquote>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
