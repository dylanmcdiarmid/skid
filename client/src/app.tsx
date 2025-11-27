import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useMatches,
} from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { TopBar } from '@/components/top-bar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import DayTemplates from './pages/day-templates';
import DemoDataTable from './pages/demo-data-table';
import DemoEditableList from './pages/demo-editable-list';
import DemoEditableText from './pages/demo-editable-text';
import DemoSortableList from './pages/demo-sortable-list';
import GeneratorHistory from './pages/generator-history';
import Generators from './pages/generators';
import History from './pages/history';
import Planning from './pages/planning';
import PracticeSessions from './pages/practice-sessions';
import Settings from './pages/settings';
import Today from './pages/today';
import {
  notificationsAtom,
  removeNotificationAtom,
} from './state/notifications';

const PAGE_TITLES: Record<string, { title: string }> = {
  '/': {
    title: 'Today',
  },
  '/planning': {
    title: 'Planning',
  },
  '/history': {
    title: 'History',
  },
  '/templates/days': {
    title: 'Day Templates',
  },
  '/templates/sessions': {
    title: 'Practice Sessions',
  },
  '/templates/generators': {
    title: 'Generators',
  },
  '/insights/generator-history': {
    title: 'Generator History',
  },
  '/settings': {
    title: 'Settings',
  },
  '/demo/sortable-list': {
    title: 'Sortable List Demo',
  },
  '/demo/editable-text': {
    title: 'Editable Text Demo',
  },
  '/demo/editable-list': {
    title: 'Editable List Demo',
  },
  '/demo/data-table': {
    title: 'Data Table Demo',
  },
};

function RootLayout() {
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname || '/';
  const pageInfo = PAGE_TITLES[currentPath] || { title: '' };
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
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <Toaster closeButton richColors />
        <main className="flex min-h-svh w-full min-w-0 flex-1 flex-col bg-bg-app">
          <TopBar title={pageInfo.title} />
          <div className="min-w-0 flex-1">
            <div className="min-h-full min-w-0 p-4">
              <Outlet />
            </div>
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const routeTree = rootRoute.addChildren([
  // Daily Actions
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Today,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/planning',
    component: Planning,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/history',
    component: History,
  }),
  // Templates
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/templates/days',
    component: DayTemplates,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/templates/sessions',
    component: PracticeSessions,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/templates/generators',
    component: Generators,
  }),
  // Insights
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/insights/generator-history',
    component: GeneratorHistory,
  }),
  // Settings
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: Settings,
  }),
  // Demos
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo/sortable-list',
    component: DemoSortableList,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo/editable-text',
    component: DemoEditableText,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo/editable-list',
    component: DemoEditableList,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/demo/data-table',
    component: DemoDataTable,
  }),
]);

const router = createRouter({ routeTree });

function App() {
  return <RouterProvider router={router} />;
}

export default App;
