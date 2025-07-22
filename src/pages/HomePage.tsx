
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from '@/components/homepage/HeroSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import CallToActionSection from '@/components/homepage/CallToActionSection';
import Footer from '@/components/homepage/Footer';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        const userRole = profile?.role || 'user';
        
        if (userRole === 'institution') {
          navigate('/institution-dashboard', { replace: true });
        } else if (userRole === 'staff') {
          navigate('/staff/dashboard', { replace: true });
        } else if (userRole === 'user') {
          navigate('/preferences', { replace: true });
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    checkUserRoleAndRedirect();
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CallToActionSection />
      <Footer />
    </div>
  );
};

export default HomePage;
