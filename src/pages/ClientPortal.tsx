import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClientPortal = () => {
  const { user } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['client-unread-messages', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      // Mock data for now - you can implement actual message counting later
      return 3;
    },
    enabled: !!user?.id
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const firstName = userProfile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Date and Greeting */}
        <div className="mb-8">
          <p className="text-muted-foreground text-sm mb-2">{formatDate()}</p>
          <h1 className="text-4xl font-bold text-foreground">
            {getGreeting()}, {firstName}
          </h1>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Unread Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {unreadMessages === 1 ? 'New message' : 'New messages'} from your team
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Current Sprint */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Sprint</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Sprint 12</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ends in 5 days
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '68%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Amount Due */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,500.00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Due on Dec 15, 2025
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Account Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Current
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Billing Status</span>
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
