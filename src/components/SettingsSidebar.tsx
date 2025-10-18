import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Users, CreditCard, Building2, Settings as SettingsIcon } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Sidebar as SidebarUI, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader
} from '@/components/ui/sidebar';
import centervertLogo from '@/assets/centervert-logo.png';

const SettingsSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();

  const accountNavigation = [
    { name: 'Profile', href: '/profile', icon: User, description: 'Personal information' },
  ];

  const adminNavigation = userRole?.isAdmin ? [
    { name: 'User Management', href: '/settings/users', icon: Users, description: 'Manage users and invitations' },
    { name: 'Client Management', href: '/clients', icon: Building2, description: 'Manage clients' },
    { name: 'Payment Settings', href: '/settings/payments', icon: CreditCard, description: 'Configure payment options' },
  ] : [];

  return (
    <SidebarUI collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader>
        {/* Logo and Back Button */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <img src={centervertLogo} alt="Centervert" className="h-8" />
        </div>
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="w-full justify-start gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <Separator />

        {/* Account Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-xs uppercase">
            <SettingsIcon className="h-4 w-4" />
            Account Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavigation.map((item) => {
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

        {/* Admin Settings */}
        {userRole?.isAdmin && adminNavigation.length > 0 && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-xs uppercase">
                <Building2 className="h-4 w-4" />
                Organization Settings
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigation.map((item) => {
                    const isActive = location.pathname === item.href || 
                                    (item.href === '/clients' && location.pathname.startsWith('/clients'));
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
          </>
        )}
      </SidebarContent>
    </SidebarUI>
  );
};

export default SettingsSidebar;
