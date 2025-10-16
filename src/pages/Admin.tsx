import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Admin = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
          </div>

          <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>View and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>User management will be available once the database is configured.</p>
              <p className="text-sm mt-2">Run the provided database migrations to enable this feature.</p>
            </div>
          </CardContent>
        </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
