
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, FileText, Clock, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(profile?.role || 'user');
        }
      } catch (err) {
        console.error('Error:', err);
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Don't show navigation on homepage for a cleaner landing experience
  if (isHomePage) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-brand-electric">
          Grofinity
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {userRole === 'staff' && (
                <>
                  <Link to="/staff/dashboard">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Staff Dashboard
                    </Button>
                  </Link>
                  <Link to="/staff/approvals">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Review Approvals
                    </Button>
                  </Link>
                  <Link to="/staff/create-offer">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Create Template
                    </Button>
                  </Link>
                  <Link to="/staff/publishing-queue">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Publishing Queue
                    </Button>
                  </Link>
                </>
              )}
              {userRole === 'user' && (
                <>
                  <Link to="/bank-statement-parser">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Statement Parser
                    </Button>
                  </Link>
                  <Link to="/preferences">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Preferences
                    </Button>
                  </Link>
                </>
              )}
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
            </>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
