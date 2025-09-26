import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthConfirm from "./pages/AuthConfirm";
import Dashboard from "./pages/Dashboard";
import MissionHub from "./pages/MissionHub";
import Assignments from "./pages/Assignments";
import Timer from "./pages/Timer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useApp();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give AppContext time to restore session
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500); // Wait 500ms for session restoration

    return () => clearTimeout(timer);
  }, []);

  // Still checking auth - show loading
  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Auth check complete - redirect if no user
  return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hub"
              element={
                <ProtectedRoute>
                  <MissionHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timer"
              element={
                <ProtectedRoute>
                  <Timer />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
