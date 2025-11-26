import {
  BeakerIcon,
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  InboxIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  BeakerIcon as BeakerIconSolid,
  CalendarIcon as CalendarIconSolid,
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  InboxIcon as InboxIconSolid,
  PencilSquareIcon as PencilSquareIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  SparklesIcon as SparklesIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { indexGlobals } from '@/lib/globals';

const dailyActionItems = [
  {
    title: 'Today',
    url: '/',
    iconDefault: StarIcon,
    iconActive: StarIconSolid,
    isPrimary: true,
  },
  {
    title: 'Planning',
    url: '/planning',
    iconDefault: InboxIcon,
    iconActive: InboxIconSolid,
    isPrimary: false,
  },
  {
    title: 'History',
    url: '/history',
    iconDefault: ClockIcon,
    iconActive: ClockIconSolid,
    isPrimary: false,
  },
];

const templateItems = [
  {
    title: 'Day Templates',
    url: '/templates/days',
    iconDefault: CalendarIcon,
    iconActive: CalendarIconSolid,
  },
  {
    title: 'Practice Sessions',
    url: '/templates/sessions',
    iconDefault: RectangleStackIcon,
    iconActive: RectangleStackIconSolid,
  },
  {
    title: 'Generators',
    url: '/templates/generators',
    iconDefault: SparklesIcon,
    iconActive: SparklesIconSolid,
  },
];

const insightItems = [
  {
    title: 'Generator History',
    url: '/insights/generator-history',
    iconDefault: Squares2X2Icon,
    iconActive: Squares2X2IconSolid,
  },
];

const devItems = [
  {
    title: 'Sortable List',
    url: '/demo/sortable-list',
    iconDefault: BeakerIcon,
    iconActive: BeakerIconSolid,
  },
  {
    title: 'Editable Text',
    url: '/demo/editable-text',
    iconDefault: PencilSquareIcon,
    iconActive: PencilSquareIconSolid,
  },
];

const getDailyActionClassName = (active: boolean, isPrimary: boolean) => {
  if (active) {
    return '!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs';
  }
  if (isPrimary) {
    return '!font-semibold scale-100 px-2 py-1.5 text-amber-600 dark:text-amber-400';
  }
  return '!font-medium scale-100 px-2 py-1.5 text-text-secondary';
};

export const AppSidebar = () => {
  const location = useLocation();
  const isDev = indexGlobals()?.isDev;

  const isActive = (url: string) =>
    url === '/' ? location.pathname === '/' : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="border-border-default border-b px-2 pb-2"
              size="lg"
            >
              <Link to="/">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                  <StarIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Skid</span>
                  <span className="text-sidebar-foreground/70 text-xs">
                    Practice Scheduler
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Daily Actions Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {dailyActionItems.map((item) => {
                const active = isActive(item.url);

                return (
                  <SidebarMenuItem className="mx-1" key={item.title}>
                    <SidebarMenuButton asChild data-active={active}>
                      <Link
                        className={`text-md transition-all duration-300 ease-in-out ${getDailyActionClassName(active, item.isPrimary)}`}
                        to={item.url}
                      >
                        {active ? (
                          <item.iconActive
                            className={`!size-5 stroke-0 ${item.isPrimary ? 'text-amber-500' : 'stroke-text-primary'}`}
                          />
                        ) : (
                          <item.iconDefault
                            className={`!size-5 ${item.isPrimary ? 'stroke-amber-500 text-amber-500' : 'stroke-text-secondary'}`}
                          />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Templates Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-normal text-sidebar-foreground/50 text-xs tracking-wider">
            TEMPLATES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {templateItems.map((item) => {
                const active = isActive(item.url);

                return (
                  <SidebarMenuItem className="mx-1" key={item.title}>
                    <SidebarMenuButton asChild data-active={active}>
                      <Link
                        className={`text-md transition-all duration-300 ease-in-out ${
                          active
                            ? '!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs'
                            : '!font-medium scale-100 px-2 py-1.5 text-text-secondary'
                        }`}
                        to={item.url}
                      >
                        {active ? (
                          <item.iconActive className="!size-5 stroke-0 stroke-text-primary" />
                        ) : (
                          <item.iconDefault className="!size-5 stroke-text-secondary" />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Insights Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-normal text-sidebar-foreground/50 text-xs tracking-wider">
            INSIGHTS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => {
                const active = isActive(item.url);

                return (
                  <SidebarMenuItem className="mx-1" key={item.title}>
                    <SidebarMenuButton asChild data-active={active}>
                      <Link
                        className={`text-md transition-all duration-300 ease-in-out ${
                          active
                            ? '!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs'
                            : '!font-medium scale-100 px-2 py-1.5 text-text-secondary'
                        }`}
                        to={item.url}
                      >
                        {active ? (
                          <item.iconActive className="!size-5 stroke-0 stroke-text-primary" />
                        ) : (
                          <item.iconDefault className="!size-5 stroke-text-secondary" />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dev Tools Section - Only visible in dev */}
        {isDev && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-normal text-sidebar-foreground/50 text-xs tracking-wider">
              DEV TOOLS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {devItems.map((item) => {
                  const active = isActive(item.url);

                  return (
                    <SidebarMenuItem className="mx-1" key={item.title}>
                      <SidebarMenuButton asChild data-active={active}>
                        <Link
                          className={`text-md transition-all duration-300 ease-in-out ${
                            active
                              ? '!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs'
                              : '!font-medium scale-100 px-2 py-1.5 text-text-secondary'
                          }`}
                          to={item.url}
                        >
                          {active ? (
                            <item.iconActive className="!size-5 stroke-0 stroke-text-primary" />
                          ) : (
                            <item.iconDefault className="!size-5 stroke-text-secondary" />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={isActive('/settings')}>
              <Link
                className={`text-md transition-all duration-300 ease-in-out ${
                  isActive('/settings')
                    ? '!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs'
                    : '!font-medium scale-100 px-2 py-1.5 text-text-secondary'
                }`}
                to="/settings"
              >
                {isActive('/settings') ? (
                  <Cog6ToothIconSolid className="!size-5 stroke-0 stroke-text-primary" />
                ) : (
                  <Cog6ToothIcon className="!size-5 stroke-text-secondary" />
                )}
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
