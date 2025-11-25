import { Link, useLocation } from 'react-router-dom';
import { Home, LogOut, Receipt, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Sidebar as SidebarUI, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import centervertLogo from '@/assets/centervert-logo.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import ClientPortalSettings from './ClientPortalSettings';

const ClientPortalSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['client-portal-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const navigation = [
    { name: 'Dashboard', href: '/client-portal', icon: Home },
    { name: 'Billing', href: '/client-portal/billing', icon: Receipt },
  ];

  return (
    <SidebarUI collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <img src={centervertLogo} alt="Centervert" className="h-8" />
        </div>

        <Separator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        
        {/* User Profile */}
        <div className="p-4">
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:bg-accent rounded-md p-2 -m-2 transition-colors"
            onClick={() => setSettingsOpen(true)}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold">
                {userProfile?.company || 'Your Company'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userProfile?.full_name || user?.email}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
                className="rounded p-1 hover:bg-accent/50"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  signOut();
                }}
                className="rounded p-1 hover:bg-accent/50"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <ClientPortalSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SidebarUI>
  );
};

export default ClientPortalSidebar;
