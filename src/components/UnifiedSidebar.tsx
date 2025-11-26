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
  const [ripples, setRipples] = useState<{ [key: string]: { x: number; y: number; id: number } | null }>({});
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === 'collapsed';
  const isAdmin = userRole?.isAdmin || false;
  const isAgent = userRole?.isAgent || false;

  const isCrmActive = location.pathname === '/contacts' || location.pathname === '/companies' || location.pathname.startsWith('/companies/') || location.pathname.startsWith('/contacts/');

  // Ripple effect handler
  const handleRipple = (event: React.MouseEvent, key: string) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setRipples(prev => ({ ...prev, [key]: { x, y, id: Date.now() } }));
    
    setTimeout(() => {
      setRipples(prev => ({ ...prev, [key]: null }));
    }, 600);
  };

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
      icon: UserSquare2,
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
          <div className="p-4 flex items-center justify-center overflow-hidden">
            <img
              src={isCollapsed ? logoIcon : logoFull}
              alt="Centervert"
              className={`
                object-contain transition-all duration-300 ease-in-out
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
                      onClick={(e) => {
                        handleRipple(e, item.name);
                        navigate(item.href);
                      }}
                      className={`
                        relative overflow-hidden
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        transition-all duration-300 ease-in-out
                        hover:shadow-lg hover:scale-[1.02]
                        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                        group
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`
                        h-5 w-5 transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-6
                        ${isActive ? 'scale-110' : ''}
                      `} />
                      {!isCollapsed && (
                        <span className="transition-all duration-200 group-hover:translate-x-1">
                          {item.name}
                        </span>
                      )}
                      {ripples[item.name] && (
                        <span
                          className="absolute rounded-full bg-white/30 animate-ping"
                          style={{
                            left: ripples[item.name]!.x,
                            top: ripples[item.name]!.y,
                            width: '20px',
                            height: '20px',
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      )}
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
                        onClick={(e) => {
                          handleRipple(e, 'CRM');
                        }}
                        className={`
                          relative overflow-hidden
                          text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          transition-all duration-300 ease-in-out
                          hover:shadow-lg hover:scale-[1.02]
                          ${isCrmActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                          ${isCollapsed ? 'justify-center' : ''}
                          group
                        `}
                        tooltip={isCollapsed ? 'CRM' : undefined}
                      >
                        <UserSquare2 className={`
                          h-5 w-5 transition-all duration-300
                          group-hover:scale-110 group-data-[state=open]/collapsible:rotate-12
                          ${isCrmActive ? 'scale-110' : ''}
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="transition-all duration-200 group-hover:translate-x-1">
                              CRM
                            </span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                        {ripples['CRM'] && (
                          <span
                            className="absolute rounded-full bg-white/30 animate-ping"
                            style={{
                              left: ripples['CRM']!.x,
                              top: ripples['CRM']!.y,
                              width: '20px',
                              height: '20px',
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                      <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <SidebarMenuSub className="space-y-1">
                          {crmItems.map((item, index) => {
                            const isActive = location.pathname === item.href || 
                              (item.href === '/companies' && location.pathname.startsWith('/companies/')) ||
                              (item.href === '/contacts' && location.pathname.startsWith('/contacts/'));
                            return (
                              <SidebarMenuSubItem 
                                key={item.name}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={(e) => {
                                    handleRipple(e, `CRM-${item.name}`);
                                    navigate(item.href);
                                  }}
                                  className={`
                                    relative overflow-hidden
                                    text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground
                                    transition-all duration-200 hover:translate-x-2 hover:shadow-md
                                    ${isActive ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground shadow-sm' : ''}
                                    group/sub
                                  `}
                                >
                                  <item.icon className={`
                                    h-4 w-4 transition-all duration-200
                                    group-hover/sub:scale-125 group-hover/sub:rotate-12
                                    ${isActive ? 'scale-110' : ''}
                                  `} />
                                  <span className="transition-all duration-200 group-hover/sub:font-medium">
                                    {item.name}
                                  </span>
                                  {ripples[`CRM-${item.name}`] && (
                                    <span
                                      className="absolute rounded-full bg-white/30 animate-ping"
                                      style={{
                                        left: ripples[`CRM-${item.name}`]!.x,
                                        top: ripples[`CRM-${item.name}`]!.y,
                                        width: '15px',
                                        height: '15px',
                                        transform: 'translate(-50%, -50%)',
                                      }}
                                    />
                                  )}
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
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={(e) => {
                        handleRipple(e, item.name);
                        navigate(item.href);
                      }}
                      className={`
                        relative overflow-hidden
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        transition-all duration-300 ease-in-out
                        hover:shadow-lg hover:scale-[1.02]
                        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                        group
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`
                        h-5 w-5 transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-6
                        ${isActive ? 'scale-110' : ''}
                      `} />
                      {!isCollapsed && (
                        <span className="transition-all duration-200 group-hover:translate-x-1">
                          {item.name}
                        </span>
                      )}
                      {ripples[item.name] && (
                        <span
                          className="absolute rounded-full bg-white/30 animate-ping"
                          style={{
                            left: ripples[item.name]!.x,
                            top: ripples[item.name]!.y,
                            width: '20px',
                            height: '20px',
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })()}

              {/* Users */}
              {navigation[2] && (() => {
                const item = navigation[2];
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={(e) => {
                        handleRipple(e, item.name);
                        navigate(item.href);
                      }}
                      className={`
                        relative overflow-hidden
                        text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        transition-all duration-300 ease-in-out
                        hover:shadow-lg hover:scale-[1.02]
                        ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                        ${isCollapsed ? 'justify-center' : ''}
                        group
                      `}
                      tooltip={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`
                        h-5 w-5 transition-all duration-300
                        group-hover:scale-110 group-hover:rotate-6
                        ${isActive ? 'scale-110' : ''}
                      `} />
                      {!isCollapsed && (
                        <span className="transition-all duration-200 group-hover:translate-x-1">
                          {item.name}
                        </span>
                      )}
                      {ripples[item.name] && (
                        <span
                          className="absolute rounded-full bg-white/30 animate-ping"
                          style={{
                            left: ripples[item.name]!.x,
                            top: ripples[item.name]!.y,
                            width: '20px',
                            height: '20px',
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })()}

              {/* Settings */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/settings'}
                    onClick={(e) => {
                      handleRipple(e, 'Settings');
                      navigate('/settings');
                    }}
                    className={`
                      relative overflow-hidden
                      text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                      transition-all duration-300 ease-in-out
                      hover:shadow-lg hover:scale-[1.02]
                      ${location.pathname === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md' : ''}
                      ${isCollapsed ? 'justify-center' : ''}
                      group
                    `}
                    tooltip={isCollapsed ? 'Settings' : undefined}
                  >
                    <Settings className={`
                      h-5 w-5 transition-all duration-300
                      group-hover:scale-110 group-hover:rotate-90
                      ${location.pathname === '/settings' ? 'scale-110 rotate-90' : ''}
                    `} />
                    {!isCollapsed && (
                      <span className="transition-all duration-200 group-hover:translate-x-1">
                        Settings
                      </span>
                    )}
                    {ripples['Settings'] && (
                      <span
                        className="absolute rounded-full bg-white/30 animate-ping"
                        style={{
                          left: ripples['Settings']!.x,
                          top: ripples['Settings']!.y,
                          width: '20px',
                          height: '20px',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    )}
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
            className="w-8 h-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 hover:scale-110 group"
          >
            <div className="border border-sidebar-foreground rounded-sm p-0.5 transition-all duration-300 group-hover:border-sidebar-accent-foreground group-hover:shadow-md">
              <ChevronLeft className={`h-3 w-3 transition-all duration-500 ease-in-out ${isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default UnifiedSidebar;
