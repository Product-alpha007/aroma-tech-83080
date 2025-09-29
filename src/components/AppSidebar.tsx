import { Home, Cpu, MapPin, Settings, Activity, Package, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Devices", url: "/devices", icon: Cpu },
  { title: "Users", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={cn("border-r border-border bg-sidebar transition-all duration-300", 
      collapsed ? "w-16" : "w-64")}>
      <div className="h-16 flex items-center px-6 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">AromaTech</span>
          </div>
        )}
      </div>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          "hover:bg-card hover:shadow-glow",
                          isActive && "bg-gradient-glass border border-primary/30 shadow-glow"
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}