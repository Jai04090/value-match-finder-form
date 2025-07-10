import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, TrendingUp } from 'lucide-react';

const StaffDashboard = () => {
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
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
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
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
              <div className="text-2xl font-bold">347</div>
              <p className="text-xs text-muted-foreground">
                +23% from last month
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
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Student Referral Template</div>
                    <div className="text-muted-foreground">Used by First National Bank</div>
                  </div>
                  <div className="text-xs text-muted-foreground">2h ago</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">DEI Initiative Template</div>
                    <div className="text-muted-foreground">Created by you</div>
                  </div>
                  <div className="text-xs text-muted-foreground">1d ago</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Green Banking Template</div>
                    <div className="text-muted-foreground">Used by Community Credit Union</div>
                  </div>
                  <div className="text-xs text-muted-foreground">2d ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;