import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';

const TEST_USERS = [
  { email: 'test-admin@dev.local', password: 'admin123', label: 'Admin', color: 'bg-red-500' },
  { email: 'test-agent@dev.local', password: 'agent123', label: 'Agent', color: 'bg-blue-500' },
  { email: 'test-user@dev.local', password: 'user123', label: 'User', color: 'bg-green-500' },
];

export const DevUserSwitcher = () => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const setupTestUsers = async () => {
    setIsSettingUp(true);
    let successCount = 0;
    
    for (const testUser of TEST_USERS) {
      try {
        const { error } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              full_name: `Test ${testUser.label}`,
            }
          }
        });
        
        if (!error) successCount++;
      } catch (err) {
        console.error(`Failed to create ${testUser.email}:`, err);
      }
    }
    
    setIsSettingUp(false);
    
    if (successCount > 0) {
      toast.success(`Created ${successCount} test users. You can now switch between them.`);
    } else {
      toast.error('Test users may already exist. Try switching directly.');
    }
  };

  const handleSwitchUser = async (email: string, password: string, label: string) => {
    setIsSwitching(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Test users not set up yet. Click "Setup Test Users" first.');
        } else {
          throw error;
        }
        setIsSwitching(false);
        return;
      }

      toast.success(`Switched to ${label}`);

      // Reload to ensure all queries refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Switch user error:', error);
      toast.error('Could not switch user account');
      setIsSwitching(false);
    }
  };

  const currentUserType = userRole?.isAdmin ? 'Admin' : userRole?.isAgent ? 'Agent' : 'User';
  const currentColor = userRole?.isAdmin ? 'bg-red-500' : userRole?.isAgent ? 'bg-blue-500' : 'bg-green-500';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={isSwitching || isSettingUp}
        >
          {isSwitching || isSettingUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <div className={`w-2 h-2 rounded-full ${currentColor} animate-pulse`} />
              <span className="text-xs font-medium">{currentUserType}</span>
              <Badge variant="secondary" className="text-xs">DEV</Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Dev User Switcher</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {TEST_USERS.map((testUser) => (
          <DropdownMenuItem
            key={testUser.email}
            onClick={() => handleSwitchUser(testUser.email, testUser.password, testUser.label)}
            disabled={isSwitching || user?.email === testUser.email}
            className="cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full ${testUser.color} mr-2`} />
            <span>{testUser.label}</span>
            {user?.email === testUser.email && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={setupTestUsers}
          disabled={isSettingUp}
          className="cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          <span>Setup Test Users</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
