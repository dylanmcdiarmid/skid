import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useMatches,
} from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "./pages/dashboard";
import LocationInspector from "./pages/location-inspector";
import Scratch from "./pages/scratch";
import StreamingDemo from "./pages/streaming-demo";
import Upload from "./pages/upload";
import Users from "./pages/users";
import {
  notificationsAtom,
  removeNotificationAtom,
} from "./state/notifications";

const PAGE_TITLES: Record<string, { title: string }> = {
  "/": {
    title: "Dashboard",
  },
  "/streaming": {
    title: "Real-Time Streaming Demo",
  },
  "/upload": {
    title: "Upload",
  },
  "/locations": {
    title: "Locations",
  },
  "/users": {
    title: "Users",
  },
};

function RootLayout() {
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname || "/";
  const pageInfo = PAGE_TITLES[currentPath] || { title: "" };
  const notifications = useAtomValue(notificationsAtom);
  const removeNotification = useSetAtom(removeNotificationAtom);

  useEffect(() => {
    for (const notification of notifications) {
      toast[notification.kind](notification.message, {
        onDismiss: () => removeNotification(notification.id),
        onAutoClose: () => removeNotification(notification.id),
      });
    }
  }, [notifications, removeNotification]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <Toaster closeButton richColors />
      <main className="flex h-svh w-full min-w-0 flex-1 flex-col bg-bg-app">
        <TopBar title={pageInfo.title} />
        <div className="min-h-0 min-w-0 flex-1">
          <div className="h-full min-h-0 min-w-0 p-4">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations",
  component: LocationInspector,
});

const locationByIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations/$locationId",
  component: LocationInspector,
});

const scratchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scratch",
  component: Scratch,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  locationsRoute,
  locationByIdRoute,
  scratchRoute,
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/upload",
    component: Upload,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/streaming",
    component: StreamingDemo,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/users",
    component: Users,
  }),
]);

const router = createRouter({ routeTree });

function App() {
  return <RouterProvider router={router} />;
}

export default App;
