import { useLocation, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  UserSquare2,
  ChevronRight,
  Search,
  ChevronLeft,
  UserCircle,
  Target,
  Briefcase,
  FolderKanban,
  ClipboardList,
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
  const { data: userRole, isLoading: isRoleLoading, isFetched } = useUserRole();
  const [activeWorkOpen, setActiveWorkOpen] = useState(true);
  const [crmOpen, setCrmOpen] = useState(true);
  const [backOfficeOpen, setBackOfficeOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === 'collapsed';
  const isAdmin = userRole?.isAdmin || false;
  const isAgent = userRole?.isAgent || false;
  const isSalesAgent = userRole?.isSalesAgent || false;
  
  // Check if we have definitive role info - if not fetched yet, show all menus
  const hasRoleInfo = isFetched && userRole !== null && userRole !== undefined;

  const isActiveWorkActive = location.pathname === '/projects' || location.pathname.startsWith('/projects/');
  const isCrmActive = location.pathname === '/contacts' || location.pathname === '/organizations' || location.pathname === '/opportunities' || location.pathname.startsWith('/organizations/') || location.pathname.startsWith('/contacts/') || location.pathname.startsWith('/opportunities/');
  const isBackOfficeActive = location.pathname === '/hr' || location.pathname === '/expenses' || location.pathname === '/billing' || location.pathname === '/users';
  
  // Show menus while loading OR if we don't have role info yet
  // Once we have confirmed role data, apply role-based visibility
  const showActiveWork = !hasRoleInfo || isAdmin || isAgent || isSalesAgent;
  const showCrm = !hasRoleInfo || isAdmin || isAgent || isSalesAgent;
  const showBackOffice = !hasRoleInfo || isAdmin; // Only admins see Back Office

  // Navigation items based on role
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
  ].filter(item => item.show);

  const activeWorkItems = [
    {
      name: 'Projects',
      href: '/projects',
      icon: ClipboardList,
    },
  ];

  const crmItems = [
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Users,
    },
    {
      name: 'Organizations',
      href: '/organizations',
      icon: Building2,
    },
    {
      name: 'Opportunities (NEW)',
      href: '/deals',
      icon: Target,
    },
    {
      name: 'Opportunities (Legacy)',
      href: '/opportunities',
      icon: Target,
    },
  ];

  const backOfficeItems = [
    {
      name: 'Human Resources',
      href: '/hr',
      icon: UserSquare2,
    },
    {
      name: 'Finance Tracking',
      href: '/expenses',
      icon: Receipt,
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: Receipt,
    },
    {
      name: 'Team',
      href: '/users',
      icon: Users,
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
          <div className="p-4 flex items-center justify-center overflow-hidden">
            <img
              src={isCollapsed ? logoIcon : logoFull}
              alt="Centervert"
              className={`
                object-contain transition-all duration-normal ease-smooth
                ${isCollapsed ? 'h-10 w-10' : 'h-10 w-auto'}
              `}
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
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      className={`
                        relative overflow-hidden select-none
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        transition-all duration-normal ease-smooth
                        hover:shadow-lg hover:scale-[1.02]
                        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                        group
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`
                        h-5 w-5 transition-all duration-normal ease-smooth
                        hover:scale-110
                        ${isActive ? 'rotate-6' : ''}
                      `} />
                      {!isCollapsed && (
                        <span className="transition-all duration-fast ease-smooth">
                          {item.name}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })()}

              {/* Active Work */}
              {showActiveWork && (
                <Collapsible open={activeWorkOpen} onOpenChange={setActiveWorkOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isActiveWorkActive}
                        className={`
                          relative overflow-hidden select-none
                          text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          transition-all duration-normal ease-smooth
                          hover:shadow-lg hover:scale-[1.02]
                          ${isActiveWorkActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                          ${isCollapsed ? 'justify-center' : ''}
                          group
                        `}
                        tooltip={isCollapsed ? 'Active Work' : undefined}
                      >
                        <FolderKanban className={`
                          h-5 w-5 transition-all duration-normal ease-smooth
                          hover:scale-110
                          ${isActiveWorkActive ? 'rotate-12' : ''}
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="transition-all duration-fast ease-smooth">
                              Active Work
                            </span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-normal ease-smooth group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                        <CollapsibleContent className="overflow-hidden transition-all duration-normal ease-smooth data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <SidebarMenuSub className="space-y-1 pl-2 mt-2 mb-1">
                          {activeWorkItems.map((item, index) => {
                            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                            return (
                              <SidebarMenuSubItem 
                                key={item.name}
                                className="animate-fade-in"
                                style={{ 
                                  animationDelay: `${index * 50}ms`,
                                }}
                              >
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => navigate(item.href)}
                                  className={`
                                    relative overflow-hidden select-none
                                    text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                                    transition-all duration-normal ease-smooth hover:translate-x-2 hover:shadow-md
                                    ${isActive ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground shadow-sm' : ''}
                                    group/sub
                                  `}
                                >
                                  <item.icon className={`
                                    h-4 w-4 transition-all duration-normal ease-smooth
                                    hover:scale-125
                                    ${isActive ? 'rotate-12' : ''}
                                  `} />
                                  <span className="transition-all duration-fast ease-smooth">
                                    {item.name}
                                  </span>
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

              {/* CRM */}
              {showCrm && (
                <Collapsible open={crmOpen} onOpenChange={setCrmOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isCrmActive}
                        className={`
                          relative overflow-hidden select-none
                          text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          transition-all duration-normal ease-smooth
                          hover:shadow-lg hover:scale-[1.02]
                          ${isCrmActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                          ${isCollapsed ? 'justify-center' : ''}
                          group
                        `}
                        tooltip={isCollapsed ? 'CRM' : undefined}
                      >
                        <UserSquare2 className={`
                          h-5 w-5 transition-all duration-normal ease-smooth
                          hover:scale-110
                          ${isCrmActive ? 'rotate-12' : ''}
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="transition-all duration-fast ease-smooth">
                              CRM
                            </span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-normal ease-smooth group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                        <CollapsibleContent className="overflow-hidden transition-all duration-normal ease-smooth data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <SidebarMenuSub className="space-y-1 pl-2 mt-2 mb-1">
                          {crmItems.map((item, index) => {
                            const isActive = location.pathname === item.href || 
                              (item.href === '/organizations' && location.pathname.startsWith('/organizations/')) ||
                              (item.href === '/contacts' && location.pathname.startsWith('/contacts/')) ||
                              (item.href === '/opportunities' && location.pathname.startsWith('/opportunities/'));
                            return (
                              <SidebarMenuSubItem 
                                key={item.name}
                                className="animate-fade-in"
                                style={{ 
                                  animationDelay: `${index * 50}ms`,
                                }}
                              >
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => navigate(item.href)}
                                  className={`
                                    relative overflow-hidden select-none
                                    text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                                    transition-all duration-normal ease-smooth hover:translate-x-2 hover:shadow-md
                                    ${isActive ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground shadow-sm' : ''}
                                    group/sub
                                  `}
                                >
                                  <item.icon className={`
                                    h-4 w-4 transition-all duration-normal ease-smooth
                                    hover:scale-125
                                    ${isActive ? 'rotate-12' : ''}
                                  `} />
                                  <span className="transition-all duration-fast ease-smooth">
                                    {item.name}
                                  </span>
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

              {/* Back Office */}
              {showBackOffice && (
                <Collapsible open={backOfficeOpen} onOpenChange={setBackOfficeOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isBackOfficeActive}
                        className={`
                          relative overflow-hidden select-none
                          text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          transition-all duration-normal ease-smooth
                          hover:shadow-lg hover:scale-[1.02]
                          ${isBackOfficeActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                          ${isCollapsed ? 'justify-center' : ''}
                          group
                        `}
                        tooltip={isCollapsed ? 'Back Office' : undefined}
                      >
                        <Briefcase className={`
                          h-5 w-5 transition-all duration-normal ease-smooth
                          hover:scale-110
                          ${isBackOfficeActive ? 'rotate-12' : ''}
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="transition-all duration-fast ease-smooth">
                              Back Office
                            </span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-normal ease-smooth group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                        <CollapsibleContent className="overflow-hidden transition-all duration-normal ease-smooth data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <SidebarMenuSub className="space-y-1 pl-2 mt-2 mb-1">
                          {backOfficeItems.map((item, index) => {
                            const isActive = location.pathname === item.href;
                            return (
                              <SidebarMenuSubItem 
                                key={item.name}
                                className="animate-fade-in"
                                style={{ 
                                  animationDelay: `${index * 50}ms`,
                                }}
                              >
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => navigate(item.href)}
                                  className={`
                                    relative overflow-hidden select-none
                                    text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                                    transition-all duration-normal ease-smooth hover:translate-x-2 hover:shadow-md
                                    ${isActive ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground shadow-sm' : ''}
                                    group/sub
                                  `}
                                >
                                  <item.icon className={`
                                    h-4 w-4 transition-all duration-normal ease-smooth
                                    hover:scale-125
                                    ${isActive ? 'rotate-12' : ''}
                                  `} />
                                  <span className="transition-all duration-fast ease-smooth">
                                    {item.name}
                                  </span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapse Button at Bottom */}
        <div className={`mt-auto p-3 flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-8 h-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-normal ease-smooth hover:scale-110 group"
          >
            <div className="border border-sidebar-foreground rounded-sm p-0.5 transition-all duration-normal ease-smooth group-hover:border-sidebar-accent-foreground group-hover:shadow-md">
              <ChevronLeft className={`h-3 w-3 transition-all duration-normal ease-smooth ${isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default UnifiedSidebar;
