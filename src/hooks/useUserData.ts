
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileWithPreferences {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  has_preferences: boolean;
  preferences_count: number;
}

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
  user_id: string;
}

export const useUserProfileWithPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userProfileWithPreferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .rpc('get_user_profile_with_preferences', { user_uuid: user.id });
      
      if (error) {
        throw error;
      }
      
      return data?.[0] as UserProfileWithPreferences || null;
    },
    enabled: !!user
  });
};

export const useUserPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as FormSubmission[];
    },
    enabled: !!user
  });
};

export const useUnifiedUserData = () => {
  const profileQuery = useUserProfileWithPreferences();
  const preferencesQuery = useUserPreferences();

  return {
    profile: profileQuery.data,
    preferences: preferencesQuery.data,
    latestPreferences: preferencesQuery.data?.[0] || null,
    isLoading: profileQuery.isLoading || preferencesQuery.isLoading,
    error: profileQuery.error || preferencesQuery.error,
    hasPreferences: profileQuery.data?.has_preferences || false,
    preferencesCount: profileQuery.data?.preferences_count || 0
  };
};
