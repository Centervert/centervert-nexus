import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ClientPortalSidebar from './ClientPortalSidebar';

interface ClientPortalLayoutProps {
  children: ReactNode;
}

const ClientPortalLayout = ({ children }: ClientPortalLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ClientPortalSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background">
            <SidebarTrigger />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ClientPortalLayout;
