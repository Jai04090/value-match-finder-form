
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useUnifiedUserData } from '@/hooks/useUserData';
import { Edit, User, Calendar } from 'lucide-react';

const UserPreferences = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, latestPreferences, isLoading, error, hasPreferences } = useUnifiedUserData();

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null; // Will redirect to auth
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">Error loading your data: {error.message}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Welcome, {profile?.email || user.email}
              </CardTitle>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member since {new Date(profile?.created_at || user.created_at || '').toLocaleDateString()}
              </p>
            </CardHeader>
          </Card>

          {/* Empty State Card */}
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Preferences Set
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't submitted your financial preferences yet. Let us help you find institutions that align with your values and background.
                </p>
              </div>
              <Button onClick={() => navigate('/')} size="lg">
                Submit Your Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatBooleanValue = (value: boolean | null) => {
    if (value === null) return 'Not specified';
    return value ? 'Yes' : 'No';
  };

  const formatValue = (value: string | null) => {
    return value || 'Not specified';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="h-6 w-6" />
                  Your Profile & Preferences
                </CardTitle>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  Last updated: {new Date(latestPreferences?.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Preferences Details Card */}
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              Financial Preferences Details
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.email)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Current Institution:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.current_financial_institution)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Looking For:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.looking_for)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Religion:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.religion)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Religious Organization:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.religious_organization)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Sharia Compliant:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreferences?.sharia_compliant)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Current Employer:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.current_employer)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Student/Alumni:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.student_or_alumni)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Military Service:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.current_or_former_military)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Military Branch:</span>
                <span className="text-gray-600">{formatValue(latestPreferences?.military_branch)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Environmental Initiatives:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreferences?.environmental_initiatives)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700">Diversity, Equity & Inclusion:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreferences?.diversity_equity_inclusion)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserPreferences;
