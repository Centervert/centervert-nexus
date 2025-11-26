import { useLocation, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Settings,
  UserSquare2,
  ChevronRight,
  Search,
  ChevronLeft,
  UserCircle,
} from 'lucide-react';
import logoFull from '@/assets/centervert-logo-full.png';
import logoIcon from '@/assets/centervert-logo-icon.png';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UnifiedSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  const [crmOpen, setCrmOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === 'collapsed';
  const isAdmin = userRole?.isAdmin || false;
  const isAgent = userRole?.isAgent || false;

  const isCrmActive = location.pathname === '/contacts' || location.pathname === '/companies' || location.pathname.startsWith('/companies/') || location.pathname.startsWith('/contacts/');

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
      show: isAdmin, // Admin only
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserCircle,
      show: isAdmin, // Admin only
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

  return (
    <Sidebar 
      className="border-none rounded-tr-2xl" 
      style={{ backgroundColor: '#9c5126' }}
      collapsible="icon"
    >
      <SidebarContent style={{ backgroundColor: '#9c5126' }}>
        {/* Logo and Search Bar */}
        <div>
          {/* Logo */}
          <div className="p-4 flex items-center">
            <img
              src={logoIcon}
              alt="Centervert"
              className="h-10 w-10 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          
          {/* Search Bar */}
          <div className="px-3 pb-3">
            {!isCollapsed ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
                <Input
                  type="text"
                  placeholder="Search Portal"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-sidebar-foreground/10 border-sidebar-foreground/20 text-sidebar-foreground placeholder:text-sidebar-foreground/60 focus-visible:ring-sidebar-foreground/30"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <Search className="h-5 w-5 text-sidebar-foreground/80" />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              {navigation[0] && (() => {
                const item = navigation[0];
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.href}
                      onClick={() => navigate(item.href)}
                      className={`
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        ${location.pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })()}

              {/* CRM */}
              {(isAdmin || isAgent) && (
                <Collapsible open={crmOpen} onOpenChange={setCrmOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isCrmActive}
                        className={`
                          text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          ${isCrmActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                        tooltip={isCollapsed ? 'CRM' : undefined}
                      >
                        <UserSquare2 className="h-5 w-5" />
                        {!isCollapsed && (
                          <>
                            <span>CRM</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {crmItems.map((item) => {
                            const isActive = location.pathname === item.href || 
                              (item.href === '/companies' && location.pathname.startsWith('/companies/')) ||
                              (item.href === '/contacts' && location.pathname.startsWith('/contacts/'));
                            return (
                              <SidebarMenuSubItem key={item.name}>
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => navigate(item.href)}
                                  className={`
                                    text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                                    ${isActive ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground' : ''}
                                  `}
                                >
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.name}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Billing */}
              {navigation[1] && (() => {
                const item = navigation[1];
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.href}
                      onClick={() => navigate(item.href)}
                      className={`
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        ${location.pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })()}

              {/* Settings */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/settings'}
                    onClick={() => navigate('/settings')}
                    className={`
                      text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                      ${location.pathname === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    tooltip={isCollapsed ? 'Settings' : undefined}
                  >
                    <Settings className="h-5 w-5" />
                    {!isCollapsed && <span>Settings</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapse Button at Bottom */}
        <div className={`mt-auto p-3 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-8 h-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <div className="border border-sidebar-foreground rounded-sm p-0.5">
              <ChevronLeft className={`h-3 w-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default UnifiedSidebar;
