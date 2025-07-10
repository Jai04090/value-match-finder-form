import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, LogOut, Users, BarChart3, TrendingUp, Target, Eye, MousePointer, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstitutionDashboardData } from '@/hooks/useInstitutionDashboardData';

const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    activeOffers, 
    totalViews, 
    totalClicks, 
    conversions, 
    userInterests, 
    eligibilityStats, 
    loading, 
    error 
  } = useInstitutionDashboardData();

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

  if (!user) {
    return <Navigate to="/institution-login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="text-center text-red-600 p-8">
          <p>Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const kpiData = [
    { label: "Active Offers", value: activeOffers.toString(), icon: Target },
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointer },
    { label: "Conversions", value: conversions.toString(), icon: UserCheck },
  ];

  const interestData = [
    { label: "DEI", percentage: userInterests.dei, color: "bg-primary" },
    { label: "Green Banking", percentage: userInterests.greenBanking, color: "bg-secondary" },
    { label: "Student Accounts", percentage: userInterests.students, color: "bg-accent" },
  ];

  const eligibilityData = [
    { label: "Referral Bonus Eligible", percentage: eligibilityStats.referralBonusEligible },
    { label: "ZIP Code Match", percentage: eligibilityStats.zipCodeMatch },
  ];

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
              <h1 className="text-xl font-semibold text-foreground font-playfair">Institution Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, Financial Institution</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/institution/templates" className="gap-2">
                <Target className="h-4 w-4" />
                Browse Templates
              </Link>
            </Button>
            <Button asChild>
              <Link to="/institution/user-directory" className="gap-2">
                <Users className="h-4 w-4" />
                View User Directory
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* KPI Summary Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 font-playfair text-foreground">Performance Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
                      <div className="text-sm text-muted-foreground">{kpi.label}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* User Insights */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Top Interests Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-playfair">
                <BarChart3 className="h-5 w-5" />
                Top User Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interestData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`} 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-playfair">
                <TrendingUp className="h-5 w-5" />
                Eligibility Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {eligibilityData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{item.percentage}%</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default InstitutionDashboard;