import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  BookOpen,
  Users,
  User,
  Settings,
  LogOut,
  GraduationCap,
  Home,
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
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Home } from "../../public/image.png"

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Announcements", url: "/announcements", icon: Bell },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Groups", url: "/groups", icon: Users },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center gap-2 px-4 py-6 ${!open ? 'justify-center' : ''}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold">Campus Hub</span>
              <span className="text-xs text-muted-foreground">
                {profile?.role || 'Loading...'}
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="transition-smooth"
                    >
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
        <div className={`flex items-center gap-3 p-3 ${!open ? 'justify-center' : ''}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{profile?.full_name}</span>
              <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
