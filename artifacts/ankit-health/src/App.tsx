import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import PatientDashboard from "@/pages/patient/Dashboard";
import DoctorOnboarding from "@/pages/doctor/Onboarding";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Spinner } from "@/components/ui/spinner";
import AdminPage from "@/pages/Admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRole }: { component: React.ComponentType<any>, allowedRole?: 'doctor' | 'patient' }) {
  const { user, profile, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation("/login");
      } else if (allowedRole && profile && profile.role !== allowedRole) {
        setLocation(`/${profile.role}/dashboard`);
      }
    }
  }, [user, profile, loading, location, setLocation, allowedRole]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  if (!user || (allowedRole && profile?.role !== allowedRole)) {
    return null;
  }

  return (
    <ProtectedLayout>
      <Component />
    </ProtectedLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/doctor/onboarding">
        {() => <ProtectedRoute component={DoctorOnboarding} allowedRole="doctor" />}
      </Route>
      <Route path="/doctor/dashboard">
        {() => <ProtectedRoute component={DoctorDashboard} allowedRole="doctor" />}
      </Route>
      <Route path="/patient/dashboard">
        {() => <ProtectedRoute component={PatientDashboard} allowedRole="patient" />}
      </Route>

      <Route path="/admin">
        {() => (
          <ProtectedLayout>
            <AdminPage />
          </ProtectedLayout>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
