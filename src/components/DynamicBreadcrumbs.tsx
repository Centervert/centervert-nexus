import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

export const DynamicBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Fetch entity names for detail pages
  const { data: contactName } = useQuery({
    queryKey: ['contact-name', params.id],
    queryFn: async () => {
      if (!params.id || !location.pathname.startsWith('/contacts/')) return null;
      const { data } = await supabase
        .from('contacts')
        .select('first_name, last_name')
        .eq('id', params.id)
        .single();
      return data ? `${data.first_name} ${data.last_name}` : null;
    },
    enabled: !!params.id && location.pathname.startsWith('/contacts/'),
  });

  const { data: organizationName } = useQuery({
    queryKey: ['organization-name', params.id],
    queryFn: async () => {
      if (!params.id || !location.pathname.startsWith('/organizations/')) return null;
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', params.id)
        .single();
      return data?.name || null;
    },
    enabled: !!params.id && location.pathname.startsWith('/organizations/'),
  });

  const { data: opportunityName } = useQuery({
    queryKey: ['opportunity-name', params.id],
    queryFn: async () => {
      if (!params.id || !location.pathname.startsWith('/opportunities/')) return null;
      const { data } = await supabase
        .from('opportunities')
        .select('name')
        .eq('id', params.id)
        .single();
      return data?.name || null;
    },
    enabled: !!params.id && location.pathname.startsWith('/opportunities/'),
  });

  const generateBreadcrumbs = (): BreadcrumbSegment[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbSegment[] = [];

    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard',
      isCurrentPage: location.pathname === '/dashboard',
    });

    // Return early if we're on dashboard
    if (location.pathname === '/dashboard') {
      return breadcrumbs;
    }

    // Build breadcrumbs based on route structure
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLastSegment = i === pathSegments.length - 1;
      const path = '/' + pathSegments.slice(0, i + 1).join('/');

      // Handle main sections
      if (segment === 'contacts') {
        breadcrumbs.push({
          label: 'Contacts',
          path: '/contacts',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'organizations') {
        breadcrumbs.push({
          label: 'Organizations',
          path: '/organizations',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'opportunities') {
        breadcrumbs.push({
          label: 'Opportunities',
          path: '/opportunities',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'billing') {
        breadcrumbs.push({
          label: 'Billing',
          path: '/billing',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'hr') {
        breadcrumbs.push({
          label: 'Human Resources',
          path: '/hr',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'users') {
        breadcrumbs.push({
          label: 'Users',
          path: '/users',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'profile') {
        breadcrumbs.push({
          label: 'Profile',
          path: '/profile',
          isCurrentPage: isLastSegment,
        });
      } else if (segment === 'settings') {
        breadcrumbs.push({
          label: 'Settings',
          path: '/settings',
          isCurrentPage: isLastSegment,
        });
      }
      // Handle detail pages (IDs)
      else if (isLastSegment && params.id) {
        let entityName = segment; // fallback
        
        if (location.pathname.startsWith('/contacts/')) {
          entityName = contactName || 'Loading...';
        } else if (location.pathname.startsWith('/organizations/')) {
          entityName = organizationName || 'Loading...';
        } else if (location.pathname.startsWith('/opportunities/')) {
          entityName = opportunityName || 'Loading...';
        }

        breadcrumbs.push({
          label: entityName,
          path: path,
          isCurrentPage: true,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on auth page or root
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="text-white/90 font-medium">
                  {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => navigate(crumb.path)}
                  className="cursor-pointer text-white/70 hover:text-white transition-colors duration-fast flex items-center"
                >
                  {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
