import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  useSessionManager(); // Activate session management

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(profile?.role || 'user');
        }
      } catch (err) {
        console.error('Error:', err);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // User is already logged in, redirect based on role
    if (userRole === 'institution') {
      return <Navigate to="/institution-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check role requirements
  if (requireRole && userRole !== requireRole) {
    if (userRole === 'institution') {
      return <Navigate to="/institution-dashboard" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // Redirect institutions away from user pages
  if (userRole === 'institution' && (location.pathname === '/' || location.pathname === '/preferences')) {
    return <Navigate to="/institution-dashboard" replace />;
  }

  return <>{children}</>;
};