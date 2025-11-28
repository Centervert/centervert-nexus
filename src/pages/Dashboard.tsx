import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Receipt, Target, Calendar, ArrowRight } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import UnifiedLayout from "@/components/UnifiedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const navigate = useNavigate();

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
      const [organizationsRes, contactsRes, opportunitiesRes] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('opportunities').select('id', { count: 'exact', head: true })
          .or(`owner_id.eq.${user?.id},created_by.eq.${user?.id}`),
      ]);
      return {
        totalCompanies: organizationsRes.count || 0,
        totalContacts: contactsRes.count || 0,
        totalOpportunities: opportunitiesRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const { data: myOpportunities } = useQuery({
    queryKey: ['my-opportunities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          name,
          type,
          status,
          priority,
          due_date,
          contacts (first_name, last_name),
          organizations (name)
        `)
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
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
        <div className="grid gap-4 md:grid-cols-3">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Opportunities</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOpportunities || 0}</div>
                  <p className="text-xs text-muted-foreground">Assigned to you</p>
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

        {/* My Opportunities */}
        {(isAdmin || isAgent || isSalesAgent) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Opportunities</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {myOpportunities && myOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {myOpportunities.map((opp: any) => (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium truncate">{opp.name}</h3>
                          <span className="text-xs text-muted-foreground capitalize">
                            {opp.type}
                          </span>
                          <span className="text-xs capitalize">
                            {opp.status.replace(/_/g, ' ')}
                          </span>
                          {opp.priority && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {opp.priority}
                            </span>
                          )}
                        </div>
                        {(opp.contacts || opp.organizations) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {opp.organizations?.name || 
                              `${opp.contacts?.first_name} ${opp.contacts?.last_name}`}
                          </p>
                        )}
                      </div>
                      {opp.due_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(opp.due_date), 'MMM d')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No opportunities assigned to you yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </UnifiedLayout>
  );
};

export default Dashboard;
