
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

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

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-800">
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
                </>
              )}
              {userRole === 'user' && (
                <Link to="/preferences">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Preferences
                  </Button>
                </Link>
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
