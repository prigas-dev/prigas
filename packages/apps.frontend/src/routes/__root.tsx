import { Toaster } from "@/components/ui/sonner"
import { createRootRoute, Link, Outlet } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import "../index.css"

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="h-full flex flex-col">
        <nav className="p-2 flex gap-2">
          <Link to="/projects" className="[&.active]:font-bold">
            Projects
          </Link>{" "}
        </nav>
        <hr />
        <div className="grow p-2">
          <Outlet />
        </div>
      </div>
      <Toaster />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  ),
})

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      )
