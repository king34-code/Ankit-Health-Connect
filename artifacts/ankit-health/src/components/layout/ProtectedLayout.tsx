import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Calendar, LayoutDashboard, LogOut, User } from "lucide-react";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const navItems = profile?.role === 'doctor' ? [
    { title: "Dashboard", icon: LayoutDashboard, url: "/doctor/dashboard" },
  ] : [
    { title: "Dashboard", icon: LayoutDashboard, url: "/patient/dashboard" },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Logo className="text-sidebar-foreground" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === item.url}
                  className="w-full"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-medium">
                {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.full_name}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary-border hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground" onClick={handleSignOut} data-testid="button-signout">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
