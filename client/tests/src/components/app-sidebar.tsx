import {
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  CloudArrowDownIcon as CloudArrowDownIconSolid,
  DocumentArrowUpIcon as DocumentArrowUpIconSolid,
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
} from "@heroicons/react/24/solid";
import { Link, useLocation } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import { currentUserIdAtom, userAtomFamily } from "@/state/users";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    iconDefault: HomeIcon,
    iconActive: HomeIconSolid,
  },
  {
    title: "Upload",
    url: "/upload",
    iconDefault: DocumentArrowUpIcon,
    iconActive: DocumentArrowUpIconSolid,
  },
  {
    title: "Live Streaming",
    url: "/streaming",
    iconDefault: CloudArrowDownIcon,
    iconActive: CloudArrowDownIconSolid,
  },
  {
    title: "Users",
    url: "/users",
    iconDefault: UsersIcon,
    iconActive: UsersIconSolid,
  },
];

export const AppSidebar = () => {
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useAtom(currentUserIdAtom);
  const user = useAtomValue(userAtomFamily(currentUserId));

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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green">
                  <ChartBarIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">AirDashboard</span>
                  <span className="text-sidebar-foreground/70 text-xs">
                    Air Quality Monitor
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem className="mx-1" key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link
                        className={`text-md transition-all duration-300 ease-in-out ${isActive ? "!bg-bg-surface !font-bold scale-105 rounded-xs px-3 py-2 text-text-primary shadow-xs" : "!font-medium scale-100 px-2 py-1.5 text-text-secondary"}`}
                        to={item.url}
                      >
                        {isActive ? (
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

        <SidebarGroup>
          <SidebarGroupLabel className="font-normal text-sidebar-foreground text-xs tracking-wider">
            ACTIONS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button className="text-text-primary" type="button">
                    <BellIcon className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button className="text-text-primary" type="button">
                    <Cog6ToothIcon className="h-5 w-5" />
                    <span>Settings</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-state-draft">
                    <UserIcon className="h-4 w-4 text-text-primary" />
                  </span>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="font-medium text-sidebar-foreground text-sm">
                      {user?.name ?? "—"}
                    </span>
                    <span className="text-sidebar-foreground/70 text-xs">
                      {user?.roles[0] ?? "—"}
                    </span>
                  </div>
                  <EllipsisHorizontalIcon className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" side="top">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Cog6ToothIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    currentUserId
                      ? setCurrentUserId(null)
                      : setCurrentUserId("1");
                  }}
                >
                  {currentUserId ? (
                    <>
                      <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" />
                      Log out
                    </>
                  ) : (
                    <>
                      <ArrowRightEndOnRectangleIcon className="mr-2 h-4 w-4" />
                      Log in
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
