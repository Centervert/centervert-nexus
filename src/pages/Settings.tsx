import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import SettingsSidebar from '@/components/SettingsSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, CreditCard, Building2, ArrowRight } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userRole } = useUserRole();

  const accountSettings = [
    {
      title: 'Profile',
      description: 'Manage your personal information and account details',
      icon: User,
      href: '/profile',
      color: 'text-blue-600'
    },
  ];

  const adminSettings = userRole?.isAdmin ? [
    {
      title: 'User Management',
      description: 'Invite and manage users, assign roles and permissions',
      icon: Users,
      href: '/settings/users',
      color: 'text-purple-600'
    },
    {
      title: 'Client Management',
      description: 'Manage client accounts, contacts, and relationships',
      icon: Building2,
      href: '/clients',
      color: 'text-green-600'
    },
    {
      title: 'Payment Settings',
      description: 'Configure payment methods and billing preferences',
      icon: CreditCard,
      href: '/settings/payments',
      color: 'text-orange-600'
    },
  ] : [];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SettingsSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>

          <div className="p-4 md:p-8 max-w-6xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Account & Settings</h2>
              <p className="text-muted-foreground">
                Manage your account preferences and organization settings
              </p>
            </div>

            {/* Account Settings */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Account</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {accountSettings.map((setting) => (
                  <Card key={setting.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(setting.href)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${setting.color}`}>
                            <setting.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{setting.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {setting.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Admin Settings */}
            {userRole?.isAdmin && adminSettings.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Organization</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {adminSettings.map((setting) => (
                    <Card key={setting.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(setting.href)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-muted ${setting.color}`}>
                              <setting.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{setting.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {setting.description}
                              </CardDescription>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
