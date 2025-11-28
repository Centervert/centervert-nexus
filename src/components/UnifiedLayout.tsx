import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, UserSquare2, Shield, Users, Briefcase } from 'lucide-react';
import UnifiedSidebar from './UnifiedSidebar';
import { NotificationBell } from './notifications/NotificationBell';
import { DynamicBreadcrumbs } from './DynamicBreadcrumbs';
import { useUserRole } from '@/hooks/useUserRole';
interface UnifiedLayoutProps {
  children: ReactNode;
}
const UnifiedLayout = ({
  children
}: UnifiedLayoutProps) => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const { data: userRole } = useUserRole();
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
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserRoleLabel = () => {
    if (userRole?.isAdmin) return 'Admin';
    if (userRole?.isSalesAgent) return 'Sales Agent';
    if (userRole?.isAgent) return 'Team Member';
    return 'User';
  };
  return <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <UnifiedSidebar />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#9c5126' }}>
          <header className="h-12 flex items-center justify-between px-4 gap-4">
            <div className="flex-1 min-w-0">
              <DynamicBreadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">
                      {profile?.full_name || user?.email}
                    </p>
                    {profile?.company && <p className="text-xs text-white/80">
                        {profile.company}
                      </p>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {/* User Info Header */}
                <div className="px-2 py-3 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {userRole?.isAdmin ? (
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    ) : userRole?.isSalesAgent ? (
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                      {getUserRoleLabel()}
                    </span>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserSquare2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 bg-background rounded-tl-2xl page-transition">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
export default UnifiedLayout;