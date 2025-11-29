import {
  Home,
  Bell,
  Calendar,
  CalendarDays,
  BookOpen,
  Users,
  User,
  Settings,
  LogOut,
  GraduationCap,
  Zap,
  MessageCircle,
  Rocket,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getNavItems = (role: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Announcements", url: "/announcements", icon: Bell },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Events", url: "/events", icon: CalendarDays },
    { title: "Resources", url: "/resources", icon: BookOpen },
    { title: "Groups", url: "/groups", icon: Users },
    { title: "Forums", url: "/forums", icon: MessageCircle },
    { title: "Projects", url: "/projects", icon: Rocket },
    { title: "Chat", url: "/chat", icon: Zap },
  ];

  // Role-specific items
  if (role === "admin") {
    baseItems.splice(5, 0, { title: "Classes", url: "/classes", icon: GraduationCap });
  } else if (role === "faculty") {
    baseItems.splice(5, 0, { title: "My Classes", url: "/my-classes", icon: GraduationCap });
  } else if (role === "student") {
    baseItems.splice(5, 0, { title: "My Classes", url: "/my-classes", icon: GraduationCap });
  }

  baseItems.push({ title: "Profile", url: "/profile", icon: User });
  return baseItems;
};

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center gap-2 px-4 py-6 ${!open ? 'justify-center' : ''}`}>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
            <img src="/svvv.png" alt="SVVV logo" className="h-12 w-12 object-contain" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Campus Hub</span>
              <span className="text-xs text-muted-foreground">
                {user?.role || "Loading..."}
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems(user?.role || "").map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="transition-smooth">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <NavLink to="/settings" className="transition-smooth">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={`flex items-center gap-3 p-3 ${
            !open ? "justify-center" : ""
          }`}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {user?.name || "User"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email || "Updating profile..."}
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
