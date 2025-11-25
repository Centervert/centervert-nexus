import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TicketDetail from "./pages/TicketDetail";
import Settings from "./pages/Settings";
import UserManagement from "./pages/settings/UserManagement";
import PaymentSettings from "./pages/settings/PaymentSettings";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ManagedServices from "./pages/ManagedServices";
import ManagedServiceDetail from "./pages/ManagedServiceDetail";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import DevProjects from "./pages/DevProjects";
import DevProjectDetail from "./pages/DevProjectDetail";
import NotFound from "./pages/NotFound";
import ClientPortal from "./pages/ClientPortal";
import ClientPortalLayout from "./components/client-portal/ClientPortalLayout";
import ClientBilling from "./pages/ClientBilling";

const queryClient = new QueryClient();

const App = () => {
  // Disable automatic scroll restoration
  React.useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<Navigate to="/settings" replace />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/payments"
                element={
                  <ProtectedRoute adminOnly>
                    <PaymentSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute adminOnly>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/:id"
                element={
                  <ProtectedRoute adminOnly>
                    <ClientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/managed-services"
                element={
                  <ProtectedRoute>
                    <ManagedServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/managed-services/:id"
                element={
                  <ProtectedRoute>
                    <ManagedServiceDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/opportunities"
                element={
                  <ProtectedRoute adminOnly>
                    <Opportunities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/opportunities/:id"
                element={
                  <ProtectedRoute adminOnly>
                    <OpportunityDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute adminOnly>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dev-projects"
                element={
                  <ProtectedRoute adminOnly>
                    <DevProjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dev-projects/:id"
                element={
                  <ProtectedRoute adminOnly>
                    <DevProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-portal"
                element={
                  <ProtectedRoute>
                    <ClientPortalLayout>
                      <ClientPortal />
                    </ClientPortalLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-portal/billing"
                element={
                  <ProtectedRoute>
                    <ClientPortalLayout>
                      <ClientBilling />
                    </ClientPortalLayout>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
