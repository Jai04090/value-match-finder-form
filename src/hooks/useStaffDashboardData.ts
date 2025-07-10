import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffDashboardData {
  activeTemplates: number;
  partnerInstitutions: number;
  offersSent: number;
  recentActivity: {
    id: string;
    title: string;
    description: string;
    time: string;
  }[];
  loading: boolean;
  error: string | null;
}

export const useStaffDashboardData = (): StaffDashboardData => {
  const [data, setData] = useState<StaffDashboardData>({
    activeTemplates: 0,
    partnerInstitutions: 0,
    offersSent: 0,
    recentActivity: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch active templates count (approved templates)
        const { count: templatesCount, error: templatesError } = await supabase
          .from('offer_templates')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'approved');

        if (templatesError) throw new Error(`Templates error: ${templatesError.message}`);

        // Fetch partner institutions count
        const { count: institutionsCount, error: institutionsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'institution');

        if (institutionsError) throw new Error(`Institutions error: ${institutionsError.message}`);

        // Fetch offers sent count
        const { count: offersCount, error: offersError } = await supabase
          .from('institution_offers')
          .select('*', { count: 'exact', head: true });

        if (offersError) throw new Error(`Offers error: ${offersError.message}`);

        // Fetch recent activity (recent templates and offers)
        const { data: recentTemplates, error: recentTemplatesError } = await supabase
          .from('offer_templates')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentTemplatesError) throw new Error(`Recent templates error: ${recentTemplatesError.message}`);

        const { data: recentOffers, error: recentOffersError } = await supabase
          .from('institution_offers')
          .select(`
            id, 
            title, 
            created_at,
            profiles!institution_offers_institution_id_fkey(institution_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentOffersError) throw new Error(`Recent offers error: ${recentOffersError.message}`);

        // Combine and format recent activity
        const recentActivity = [
          ...(recentTemplates || []).map(template => ({
            id: template.id,
            title: template.name,
            description: 'Template created',
            time: getRelativeTime(template.created_at),
          })),
          ...(recentOffers || []).map(offer => ({
            id: offer.id,
            title: offer.title,
            description: `Used by ${(offer.profiles as any)?.institution_name || 'Institution'}`,
            time: getRelativeTime(offer.created_at),
          })),
        ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 3);

        setData({
          activeTemplates: templatesCount || 0,
          partnerInstitutions: institutionsCount || 0,
          offersSent: offersCount || 0,
          recentActivity,
          loading: false,
          error: null,
        });

      } catch (error: any) {
        console.error('Error fetching staff dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch dashboard data',
        }));
      }
    };

    fetchDashboardData();
  }, []);

  return data;
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};