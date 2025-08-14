import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TemplatedSendOfferModal } from '@/components/institution/TemplatedSendOfferModal';
import BulkOfferModal from '@/components/institution/BulkOfferModal';
import { Building2, LogOut, Users, Filter, Mail, BarChart3, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_student: boolean;
  green_banking_interest: boolean;
  dei_preference: boolean;
}

const UserDirectory: React.FC = () => {
  const { user } = useAuth();
  const [institutionRole, setInstitutionRole] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
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
          .select('id, full_name, email')
          .eq('role', 'user');

        if (usersError) throw usersError;

        // Load form submissions with preferences - order by created_at DESC to get most recent
        const { data: formSubmissions, error: formsError } = await supabase
          .from('form_submissions')
          .select('user_id, email, student_or_alumni, diversity_equity_inclusion, environmental_initiatives, created_at')
          .order('created_at', { ascending: false });

        if (formsError) throw formsError;

        console.log('Form submissions loaded:', formSubmissions?.length);
        console.log('Sample form submission:', formSubmissions?.[0]);

        // Create a map to store the most recent submission for each user
        const userSubmissionMap = new Map();
        
        formSubmissions?.forEach(submission => {
          const userId = submission.user_id;
          const email = submission.email;
          
          // For submissions with user_id, use that as key
          if (userId && !userSubmissionMap.has(userId)) {
            userSubmissionMap.set(userId, submission);
          }
          
          // For submissions without user_id but with email, use email as fallback
          if (!userId && email && !userSubmissionMap.has(email)) {
            userSubmissionMap.set(email, submission);
          }
        });

        console.log('User submission map:', userSubmissionMap);

        // Merge the data by user_id first, then fallback to email
        const usersWithPreferences = userProfiles?.map(profile => {
          // Try to find submission by user_id first, then by email
          const submission = userSubmissionMap.get(profile.id) || userSubmissionMap.get(profile.email);
          
          // Check if user is a student or alumni based on their response
          const studentOrAlumniText = submission?.student_or_alumni?.toLowerCase().trim() || '';
          const isStudent = studentOrAlumniText !== '' && 
            (studentOrAlumniText.includes('student') || 
             studentOrAlumniText.includes('alum') || 
             studentOrAlumniText.includes('university') ||
             studentOrAlumniText.includes('college') ||
             studentOrAlumniText.includes('school'));
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            is_student: isStudent,
            dei_preference: submission?.diversity_equity_inclusion === true,
            green_banking_interest: submission?.environmental_initiatives === true
          };
        }) || [];

        setUsers(usersWithPreferences);
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

  const handleUserSelect = (user: UserProfile, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkOffer = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to send a bulk offer.",
        variant: "destructive",
      });
      return;
    }
    setShowBulkModal(true);
  };

  const handleBulkOfferSuccess = () => {
    setSelectedUsers([]);
    setShowBulkModal(false);
  };

  if (!user) {
    return <Navigate to="/institution-login" replace />;
  }

  if (institutionRole && institutionRole !== 'institution') {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground font-playfair">User Directory</h1>
              <p className="text-sm text-muted-foreground">Welcome, {institutionName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/institution-dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Directory ({filteredUsers.length} users)
            </CardTitle>

            {/* Filters & Bulk Actions */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
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
                
                <div className="flex items-center gap-2">
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-2 py-1">
                        {selectedUsers.length} selected
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={handleBulkOffer}
                        className="gap-2"
                      >
                        <Send className="h-3 w-3" />
                        Send Bulk Offer
                      </Button>
                    </div>
                  )}
                </div>
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
                      <th className="text-left p-3 font-medium text-foreground w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all users"
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-foreground">Email</th>
                      <th className="text-center p-3 font-medium text-foreground">Student</th>
                      <th className="text-center p-3 font-medium text-foreground">DEI</th>
                      <th className="text-center p-3 font-medium text-foreground">Green Banking</th>
                      <th className="text-left p-3 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      return (
                        <tr key={user.id} className={`border-b border-border/50 hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleUserSelect(user, checked === true)}
                              aria-label={`Select ${user.email}`}
                            />
                          </td>
                          <td className="p-3 text-foreground">
                            {user.email || 'N/A'}
                          </td>
                        <td className="p-3 text-center">
                          {user.is_student ? (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {user.dei_preference ? (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {user.green_banking_interest ? (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {selectedUser && (
          <TemplatedSendOfferModal
            user={selectedUser}
            institutionId={user?.id || ''}
            onClose={() => setSelectedUser(null)}
            onSuccess={() => {
              setSelectedUser(null);
              toast({
                title: "Offer Sent",
                description: "Your offer has been sent successfully.",
              });
            }}
          />
        )}

        <BulkOfferModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          selectedUsers={selectedUsers}
          institutionId={user?.id || ''}
          onSuccess={handleBulkOfferSuccess}
        />
    </div>
  );
};

export default UserDirectory;