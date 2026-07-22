import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import UnifiedLayout from '@/components/UnifiedLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ArrowRight, Bot } from 'lucide-react';

type SettingItem = {
  title: string;
  description: string;
  icon: typeof User;
  href: string;
};

const Settings = () => {
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();

  const accountSettings: SettingItem[] = [
    {
      title: 'Profile',
      description: 'Manage your personal information and account details',
      icon: User,
      href: '/profile',
    },
  ];

  const adminSettings: SettingItem[] = [
    {
      title: 'MCP Integration',
      description: 'Connect AI agents to read and modify portal data',
      icon: Bot,
      href: '/settings/mcp',
    },
  ];

  const renderCard = (setting: SettingItem) => (
    <Card
      key={setting.title}
      className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
      onClick={() => navigate(setting.href)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground group-hover:text-foreground">
              <setting.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{setting.title}</CardTitle>
              <CardDescription className="mt-1">{setting.description}</CardDescription>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <UnifiedLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account preferences and organization settings.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Account
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {accountSettings.map(renderCard)}
          </div>
        </section>

        {userRole?.isAdmin && adminSettings.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Organization
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {adminSettings.map(renderCard)}
            </div>
          </section>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default Settings;
