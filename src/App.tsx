import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TrialExpired from "./pages/TrialExpired";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isLicenseValid, profile, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  // Plan expired check (admins bypass)
  const planExpiry = (profile as any)?.fecha_vencimiento_plan;
  const planExpired =
    !isAdmin &&
    profile?.license_status === 'active' &&
    planExpiry &&
    new Date(planExpiry) < new Date();

  if (planExpired) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/unauthorized?reason=plan-expired" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    );
  }

  if (!isLicenseValid) return <TrialExpired />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
