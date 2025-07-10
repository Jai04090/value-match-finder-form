import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InstitutionDashboardData {
  activeOffers: number;
  totalViews: number;
  totalClicks: number;
  conversions: number;
  userInterests: {
    dei: number;
    greenBanking: number;
    students: number;
  };
  eligibilityStats: {
    referralBonusEligible: number;
    zipCodeMatch: number;
  };
  loading: boolean;
  error: string | null;
}

export const useInstitutionDashboardData = (): InstitutionDashboardData => {
  const { user } = useAuth();
  const [data, setData] = useState<InstitutionDashboardData>({
    activeOffers: 0,
    totalViews: 0,
    totalClicks: 0,
    conversions: 0,
    userInterests: {
      dei: 0,
      greenBanking: 0,
      students: 0,
    },
    eligibilityStats: {
      referralBonusEligible: 0,
      zipCodeMatch: 0,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch active offers for this institution
        const { data: offersData, error: offersError } = await supabase
          .from('institution_offers')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', user.id)
          .gte('expiry_date', new Date().toISOString().split('T')[0]);

        if (offersError) throw new Error(`Offers error: ${offersError.message}`);

        // Fetch total user counts for interest analytics
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('dei_preference, green_banking_interest, is_student', { count: 'exact' })
          .eq('role', 'user');

        if (usersError) throw new Error(`Users error: ${usersError.message}`);

        // Calculate interest percentages
        const totalUsers = usersData?.length || 1; // Avoid division by zero
        const deiCount = usersData?.filter(u => u.dei_preference).length || 0;
        const greenBankingCount = usersData?.filter(u => u.green_banking_interest).length || 0;
        const studentsCount = usersData?.filter(u => u.is_student).length || 0;

        // For now, we'll use placeholder values for views, clicks, and conversions
        // as we don't have tracking implemented yet
        const mockViews = Math.floor(Math.random() * 1000) + 500;
        const mockClicks = Math.floor(mockViews * 0.15); // 15% click rate
        const mockConversions = Math.floor(mockClicks * 0.25); // 25% conversion rate

        // Calculate eligibility stats (simplified for demo)
        const referralBonusEligible = Math.floor((totalUsers * 0.65));
        const zipCodeMatch = Math.floor((totalUsers * 0.80));

        setData({
          activeOffers: offersData?.length || 0,
          totalViews: mockViews,
          totalClicks: mockClicks,
          conversions: mockConversions,
          userInterests: {
            dei: Math.round((deiCount / totalUsers) * 100),
            greenBanking: Math.round((greenBankingCount / totalUsers) * 100),
            students: Math.round((studentsCount / totalUsers) * 100),
          },
          eligibilityStats: {
            referralBonusEligible: Math.round((referralBonusEligible / totalUsers) * 100),
            zipCodeMatch: Math.round((zipCodeMatch / totalUsers) * 100),
          },
          loading: false,
          error: null,
        });

      } catch (error: any) {
        console.error('Error fetching institution dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch dashboard data',
        }));
      }
    };

    fetchDashboardData();
  }, [user]);

  return data;
};