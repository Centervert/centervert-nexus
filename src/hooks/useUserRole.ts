import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    staleTime: 1000 * 60 * 10, // 10 minutes - roles don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
};
