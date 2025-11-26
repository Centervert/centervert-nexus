import { Link, useLocation } from 'react-router-dom';
import { Ticket, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import centervertLogo from '@/assets/centervert-logo.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: userRole } = useUserRole();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company')
        .eq('id', user.id)
        .single();
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      // Prioritize admin role if user has multiple roles
      const userRole = roles?.find(r => r.role === 'admin')?.role || 
                       roles?.[0]?.role || 
                       'user';
      
      return {
        fullName: profile?.full_name || user.email,
        company: profile?.company || '',
        role: userRole
      };
    },
    enabled: !!user?.id
  });

  const navigation = [
    { name: 'Tickets', href: '/dashboard', icon: Ticket },
  ];

  const initials = userProfile?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';
  
  const displayRole = userProfile?.role 
    ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
    : 'User';

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
        
        {/* Settings Link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname.startsWith('/settings') || location.pathname === '/profile'}>
              <Link to="/settings" className="py-3">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <Separator />
        
        {/* User Profile */}
        <div className="p-4">
          <div className="flex items-center gap-2.5">
            <User className="h-7 w-7 text-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold">
                {userProfile?.company || 'Your Company'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userProfile?.fullName} • {displayRole}
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded p-1 hover:bg-accent shrink-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </SidebarUI>
  );
};

export default Sidebar;
