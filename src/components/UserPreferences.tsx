
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FormSubmission {
  id: string;
  created_at: string;
  email: string | null;
  current_financial_institution: string | null;
  looking_for: string | null;
  religion: string | null;
  sharia_compliant: boolean | null;
  current_employer: string | null;
  student_or_alumni: string | null;
  current_or_former_military: string | null;
  military_branch: string | null;
  environmental_initiatives: boolean | null;
  diversity_equity_inclusion: boolean | null;
  religious_organization: string | null;
}

const UserPreferences = () => {
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      console.log('Fetching preferences from form_submissions table...');
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('Query result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Fetched data:', data);
      return data as FormSubmission[];
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
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
    console.error('Error in UserPreferences:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">Error loading preferences: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  console.log('Preferences data in component:', preferences);

  if (!preferences || preferences.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No preferences found. Please submit your preferences first.</p>
              <p className="text-sm text-gray-500 mt-2">Debug: Query returned {preferences?.length || 0} results</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const latestPreference = preferences[0];

  const formatBooleanValue = (value: boolean | null) => {
    if (value === null) return 'Not specified';
    return value ? 'Yes' : 'No';
  };

  const formatValue = (value: string | null) => {
    return value || 'Not specified';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Your Financial Preferences
            </CardTitle>
            <p className="text-sm text-gray-500">
              Submitted on {new Date(latestPreference.created_at).toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-600">{formatValue(latestPreference.email)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Current Institution:</span>
                <span className="text-gray-600">{formatValue(latestPreference.current_financial_institution)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Looking For:</span>
                <span className="text-gray-600">{formatValue(latestPreference.looking_for)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Religion:</span>
                <span className="text-gray-600">{formatValue(latestPreference.religion)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Religious Organization:</span>
                <span className="text-gray-600">{formatValue(latestPreference.religious_organization)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Sharia Compliant:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreference.sharia_compliant)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Current Employer:</span>
                <span className="text-gray-600">{formatValue(latestPreference.current_employer)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Student/Alumni:</span>
                <span className="text-gray-600">{formatValue(latestPreference.student_or_alumni)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Military Service:</span>
                <span className="text-gray-600">{formatValue(latestPreference.current_or_former_military)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Military Branch:</span>
                <span className="text-gray-600">{formatValue(latestPreference.military_branch)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">Environmental Initiatives:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreference.environmental_initiatives)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700">Diversity, Equity & Inclusion:</span>
                <span className="text-gray-600">{formatBooleanValue(latestPreference.diversity_equity_inclusion)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserPreferences;
