import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Wiki from "./pages/Wiki";
import MarketingCalendar from "./pages/MarketingCalendar";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import DealsNew from "./pages/DealsNew";
import DealDetail from "./pages/DealDetail";
import Prospects from "./pages/Prospects";
import SalesHome from "./pages/SalesHome";
import Activities from "./pages/Activities";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import ProspectDetail from "./pages/ProspectDetail";
import Billing from "@/pages/Billing";
import UserManagement from "@/pages/UserManagement";
import HumanResources from "@/pages/HumanResources";
import ExpenseTracking from "@/pages/ExpenseTracking";
import Settings from "./pages/Settings";
import McpIntegration from "./pages/McpIntegration";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
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
                path="/organizations"
                element={
                  <ProtectedRoute>
                    <Organizations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizations/:id"
                element={
                  <ProtectedRoute>
                    <OrganizationDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deals"
                element={
                  <ProtectedRoute>
                    <DealsNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deals/:id"
                element={
                  <ProtectedRoute>
                    <DealDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prospects"
                element={
                  <ProtectedRoute>
                    <Prospects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prospects/:id"
                element={
                  <ProtectedRoute>
                    <ProspectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <SalesHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <Activities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wiki"
                element={
                  <ProtectedRoute>
                    <Wiki />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute adminOnly>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr"
                element={
                  <ProtectedRoute adminOnly>
                    <HumanResources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute adminOnly>
                    <ExpenseTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute adminOnly>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/mcp"
                element={
                  <ProtectedRoute adminOnly>
                    <McpIntegration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute adminOnly>
                    <History />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
