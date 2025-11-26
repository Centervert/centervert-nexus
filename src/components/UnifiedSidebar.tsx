import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Settings,
  LogOut,
  UserSquare2,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const UnifiedSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: userRole } = useUserRole();
  const [crmOpen, setCrmOpen] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = userRole?.isAdmin || false;
  const isAgent = userRole?.isAgent || false;
  const isClient = !isAdmin && !isAgent;

  const isCrmActive = location.pathname === '/contacts' || location.pathname === '/companies' || location.pathname.startsWith('/companies/');

  // Navigation items based on role
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: Receipt,
      show: true,
    },
  ].filter(item => item.show);

  const crmItems = [
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Users,
    },
    {
      name: 'Companies',
      href: '/companies',
      icon: Building2,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {(isAdmin || isAgent) && (
                <Collapsible open={crmOpen} onOpenChange={setCrmOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isCrmActive}>
                        <UserSquare2 className="h-4 w-4" />
                        <span>CRM</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {crmItems.map((item) => {
                          const isActive = location.pathname === item.href || 
                            (item.href === '/companies' && location.pathname.startsWith('/companies/'));
                          return (
                            <SidebarMenuSubItem key={item.name}>
                              <SidebarMenuSubButton
                                isActive={isActive}
                                onClick={() => navigate(item.href)}
                              >
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isAgent) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/settings'}
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {profile?.company && (
              <p className="text-xs text-muted-foreground truncate">
                {profile.company}
              </p>
            )}
            <p className="text-sm font-medium truncate">
              {profile?.full_name || user?.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate('/profile')}
          >
            Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UnifiedSidebar;
