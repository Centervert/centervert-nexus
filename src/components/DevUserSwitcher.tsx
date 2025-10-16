import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TEST_USERS = [
  { email: 'test-admin@dev.local', password: 'admin123', label: 'Admin', color: 'bg-red-500' },
  { email: 'test-agent@dev.local', password: 'agent123', label: 'Agent', color: 'bg-blue-500' },
  { email: 'test-user@dev.local', password: 'user123', label: 'User', color: 'bg-green-500' },
];

export const DevUserSwitcher = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const handleSwitchUser = async (email: string, password: string, label: string) => {
    setIsSwitching(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Switched User',
        description: `Now viewing as ${label}`,
      });

      // Reload to ensure all queries refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Switch user error:', error);
      toast({
        title: 'Switch Failed',
        description: 'Could not switch user account',
        variant: 'destructive',
      });
      setIsSwitching(false);
    }
  };

  const currentUserType = userRole?.isAdmin ? 'Admin' : userRole?.isAgent ? 'Agent' : 'User';
  const currentColor = userRole?.isAdmin ? 'bg-red-500' : userRole?.isAgent ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-3">
          {/* Current User Display */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${currentColor} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.email}</div>
              <Badge variant="outline" className="text-xs mt-1">
                {currentUserType}
                {userRole?.roles && userRole.roles.length > 1 && ` +${userRole.roles.length - 1}`}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={isSwitching}
              className="h-8 w-8 p-0"
            >
              {isSwitching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User Switcher Buttons */}
          {isExpanded && (
            <div className="space-y-1 pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2 font-semibold">
                <User className="h-3 w-3 inline mr-1" />
                Switch Test User
              </div>
              {TEST_USERS.map((testUser) => (
                <Button
                  key={testUser.email}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSwitchUser(testUser.email, testUser.password, testUser.label)}
                  disabled={isSwitching || user?.email === testUser.email}
                  className="w-full justify-start text-xs h-8"
                >
                  <div className={`w-2 h-2 rounded-full ${testUser.color} mr-2`} />
                  {testUser.label}
                  {user?.email === testUser.email && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Dev Mode Badge */}
          <div className="mt-2 pt-2 border-t">
            <Badge variant="secondary" className="text-xs w-full justify-center">
              🔧 DEV MODE
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
