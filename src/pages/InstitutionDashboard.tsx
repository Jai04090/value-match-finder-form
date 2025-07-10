import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SendOfferModal } from '@/components/institution/SendOfferModal';
import { Building2, LogOut, Users, Filter, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  location: string | null;
  is_student: boolean;
  green_banking_interest: boolean;
  dei_preference: boolean;
}

const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [institutionRole, setInstitutionRole] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const { toast } = useToast();

  // Filters
  const [showStudentsOnly, setShowStudentsOnly] = useState(false);
  const [showDEIOnly, setShowDEIOnly] = useState(false);
  const [showGreenBankingOnly, setShowGreenBankingOnly] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkRoleAndLoadData = async () => {
      try {
        // Check user role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setInstitutionRole(profile.role);
        setInstitutionName(profile.full_name || 'Institution');

        if (profile.role !== 'institution') {
          setError('Access denied. This dashboard is for financial institutions only.');
          return;
        }

        // Load user profiles
        const { data: userProfiles, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, location, is_student, green_banking_interest, dei_preference')
          .eq('role', 'user');

        if (usersError) throw usersError;

        setUsers(userProfiles || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkRoleAndLoadData();
  }, [user]);

  useEffect(() => {
    let filtered = users;

    if (showStudentsOnly) {
      filtered = filtered.filter(user => user.is_student);
    }

    if (showDEIOnly) {
      filtered = filtered.filter(user => user.dei_preference);
    }

    if (showGreenBankingOnly) {
      filtered = filtered.filter(user => user.green_banking_interest);
    }

    setFilteredUsers(filtered);
  }, [users, showStudentsOnly, showDEIOnly, showGreenBankingOnly]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (err: any) {
      toast({
        title: "Logout Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSendOffer = (user: UserProfile) => {
    setSelectedUser(user);
    setShowOfferModal(true);
  };

  const handleOfferSent = () => {
    toast({
      title: "Offer Sent!",
      description: `Offer successfully sent to ${selectedUser?.full_name || selectedUser?.email}`,
    });
    setShowOfferModal(false);
    setSelectedUser(null);
  };

  if (!user) {
    return <Navigate to="/institution-login" replace />;
  }

  if (institutionRole && institutionRole !== 'institution') {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-yellowTint flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-yellowTint flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-yellowTint">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{institutionName}</h1>
              <p className="text-sm text-muted-foreground">Institution Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Directory ({filteredUsers.length} users)
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="students"
                  checked={showStudentsOnly}
                  onCheckedChange={(checked) => setShowStudentsOnly(checked === true)}
                />
                <label htmlFor="students" className="text-sm text-foreground">
                  Students Only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dei"
                  checked={showDEIOnly}
                  onCheckedChange={(checked) => setShowDEIOnly(checked === true)}
                />
                <label htmlFor="dei" className="text-sm text-foreground">
                  DEI Preference
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="green"
                  checked={showGreenBankingOnly}
                  onCheckedChange={(checked) => setShowGreenBankingOnly(checked === true)}
                />
                <label htmlFor="green" className="text-sm text-foreground">
                  Green Banking Interest
                </label>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-foreground">Email</th>
                      <th className="text-left p-3 font-medium text-foreground">Location</th>
                      <th className="text-left p-3 font-medium text-foreground">Preferences</th>
                      <th className="text-left p-3 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-3 text-foreground">
                          {user.full_name || 'N/A'}
                        </td>
                        <td className="p-3 text-foreground">
                          {user.email || 'N/A'}
                        </td>
                        <td className="p-3 text-foreground">
                          {user.location || 'N/A'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {user.is_student && (
                              <Badge variant="secondary" className="text-xs">Student</Badge>
                            )}
                            {user.dei_preference && (
                              <Badge variant="secondary" className="text-xs">DEI</Badge>
                            )}
                            {user.green_banking_interest && (
                              <Badge variant="secondary" className="text-xs">Green Banking</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            onClick={() => handleSendOffer(user)}
                            className="gap-2"
                          >
                            <Mail className="h-3 w-3" />
                            Send Offer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Offer Modal */}
      {showOfferModal && selectedUser && (
        <SendOfferModal
          user={selectedUser}
          institutionId={user.id}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleOfferSent}
        />
      )}
    </div>
  );
};

export default InstitutionDashboard;