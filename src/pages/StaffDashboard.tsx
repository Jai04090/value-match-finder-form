import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, TrendingUp } from 'lucide-react';
import { useStaffDashboardData } from '@/hooks/useStaffDashboardData';

const StaffDashboard = () => {
  const { activeTemplates, partnerInstitutions, offersSent, recentActivity, loading, error } = useStaffDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600 p-8">
            <p>Error loading dashboard: {error}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Manage offer templates and oversee institutional partnerships
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Templates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Available templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Partner Institutions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerInstitutions}</div>
              <p className="text-xs text-muted-foreground">
                Registered institutions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Offers Sent
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offersSent}</div>
              <p className="text-xs text-muted-foreground">
                Total offers created
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/staff/create-offer">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Offer Template
                </Button>
              </Link>
              <Link to="/staff/templates">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Templates
                </Button>
              </Link>
              <Link to="/staff/institutions">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View Institutions
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest template usage and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-muted-foreground">{activity.description}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;