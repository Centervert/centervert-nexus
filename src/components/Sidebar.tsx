import { Link, useLocation } from 'react-router-dom';
import { Ticket, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import centervertLogo from '@/assets/centervert-logo.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

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
      
      return {
        fullName: profile?.full_name || user.email,
        company: profile?.company || '',
        role: roles?.[0]?.role || 'user'
      };
    },
    enabled: !!user?.id
  });

  const navigation = [
    { name: 'Tickets', href: '/dashboard', icon: Ticket },
    { name: 'User Management', href: '/admin', icon: Users },
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
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <img src={centervertLogo} alt="Centervert" className="h-8" />
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 px-6 py-4">
        <div className="h-2 w-2 rounded-full bg-status-complete" />
        <span className="text-sm text-muted-foreground">All Systems Operational</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{userProfile?.fullName}</p>
            {userProfile?.company && (
              <p className="truncate text-xs text-muted-foreground">{userProfile.company}</p>
            )}
            <p className="text-xs text-muted-foreground">{displayRole}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded p-1 hover:bg-accent"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
