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

  return (
    <Sidebar 
      className="border-r border-sidebar-foreground/10" 
      style={{ backgroundColor: '#9c5126' }}
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Logo and Search Bar */}
        <div className="border-b border-sidebar-foreground/10">
          {/* Logo */}
          <div className="p-4 flex items-center justify-center">
            <div className="relative overflow-hidden transition-all duration-300 ease-in-out" style={{ width: isCollapsed ? '40px' : '180px', height: '40px' }}>
              <img
                src={logoIcon}
                alt="Centervert"
                className={`absolute left-0 top-0 h-10 w-10 object-contain transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <img
                src={logoFull}
                alt="Centervert"
                className={`absolute left-0 top-0 h-10 w-full object-contain transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
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
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className={`
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

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

              {(isAdmin || isAgent) && (
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-foreground/10 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UnifiedSidebar;
