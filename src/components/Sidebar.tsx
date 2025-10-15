import { Link, useLocation } from 'react-router-dom';
import { Ticket, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Tickets', href: '/dashboard', icon: Ticket },
    { name: 'User Management', href: '/admin', icon: Users },
  ];

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground">
          <span className="text-sm font-bold text-background">C</span>
        </div>
        <span className="text-lg font-bold">centervert</span>
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
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">User</p>
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
