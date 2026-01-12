import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Invalidate role query when auth state changes
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['user-role', user.id] });
    }
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin') || false;
      const isAgent = roles?.some(r => r.role === 'agent') || false;
      const isSalesAgent = roles?.some(r => r.role === 'sales_agent' as any) || false;

      return {
        isAdmin,
        isAgent,
        isSalesAgent,
        roles: roles?.map(r => r.role) || []
      };
    },
    enabled: !!user, // Only run query when user is authenticated
    staleTime: 1000 * 60 * 10, // 10 minutes - roles don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
};
