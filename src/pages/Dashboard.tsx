import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Receipt } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import UnifiedLayout from "@/components/UnifiedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FollowUpsWidget } from "@/components/prospects/FollowUpsWidget";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, company')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [organizationsRes, contactsRes] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalCompanies: organizationsRes.count || 0,
        totalContacts: contactsRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const isAdmin = userRole?.isAdmin || false;
  const isAgent = userRole?.isAgent || false;
  const isSalesAgent = userRole?.isSalesAgent || false;
  const isClient = !isAdmin && !isAgent && !isSalesAgent;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    return format(new Date(), "EEEE, MMMM d, yyyy");
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground">{formatDate()}</p>
          {profile?.company && (
            <p className="text-sm text-muted-foreground">{profile.company}</p>
          )}
        </div>

        {/* Stats Cards - Different for admin vs client */}
        <div className="grid gap-4 md:grid-cols-2">
          {(isAdmin || isAgent || isSalesAgent) && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
                  <p className="text-xs text-muted-foreground">Active companies</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
                  <p className="text-xs text-muted-foreground">Contact records</p>
                </CardContent>
              </Card>
            </>
          )}
          {isClient && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">Outstanding invoices</p>
              </CardContent>
            </Card>
          )}
        </div>

        {(isAdmin || isAgent || isSalesAgent) && <FollowUpsWidget />}

      </div>
    </UnifiedLayout>
  );
};

export default Dashboard;
