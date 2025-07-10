
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/Navigation";
import Index from "./pages/Index";
import Preferences from "./pages/Preferences";
import Auth from "./pages/Auth";
import InstitutionLogin from "./pages/InstitutionLogin";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import UserDirectory from "./pages/UserDirectory";
import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";
import StaffCreateOffer from "./pages/StaffCreateOffer";
import StaffTemplates from "./pages/StaffTemplates";
import StaffInstitutions from "./pages/StaffInstitutions";
import InstitutionTemplates from "./pages/InstitutionTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/preferences" 
              element={
                <ProtectedRoute requireRole="user">
                  <Preferences />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Auth />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/institution-login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <InstitutionLogin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/institution-dashboard" 
              element={
                <ProtectedRoute requireRole="institution">
                  <InstitutionDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff-login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <StaffLogin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/dashboard" 
              element={
                <ProtectedRoute requireRole="staff">
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/institution/user-directory" 
              element={
                <ProtectedRoute requireRole="institution">
                  <UserDirectory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/create-offer" 
              element={
                <ProtectedRoute requireRole="staff">
                  <StaffCreateOffer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/templates" 
              element={
                <ProtectedRoute requireRole="staff">
                  <StaffTemplates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/institutions" 
              element={
                <ProtectedRoute requireRole="staff">
                  <StaffInstitutions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/institution/templates" 
              element={
                <ProtectedRoute requireRole="institution">
                  <InstitutionTemplates />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
