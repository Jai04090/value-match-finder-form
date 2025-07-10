import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Eye, Edit, X, Shield, LogOut, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScheduledOffer {
  id: string;
  name: string;
  type: string;
  publish_at: string | null;
  is_published: boolean;
  approval_status: string;
  created_at: string;
  created_by: string;
}

export default function StaffPublishingQueue() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [offers, setOffers] = useState<ScheduledOffer[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'table' | 'calendar'>('table');

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(profile?.role || 'user');
        }
      } catch (err) {
        console.error('Error:', err);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole === 'staff') {
      fetchOffers();
    }
  }, [userRole]);

  const fetchOffers = async () => {
    try {
      setDataLoading(true);
      const { data, error } = await supabase
        .from('offer_templates')
        .select('id, name, type, publish_at, is_published, approval_status, created_at, created_by')
        .eq('approval_status', 'approved')
        .order('publish_at', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCancelScheduled = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offer_templates')
        .update({ publish_at: null })
        .eq('id', offerId);

      if (error) throw error;

      // Log the cancellation
      await supabase
        .from('template_publishing_logs')
        .insert({
          template_id: offerId,
          action: 'cancelled',
          staff_user_id: user?.id
        });

      toast({
        title: "Schedule Cancelled",
        description: "The scheduled publication has been cancelled.",
      });

      fetchOffers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleManualPublish = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('offer_templates')
        .update({ 
          is_published: true,
          publish_at: null 
        })
        .eq('id', offerId);

      if (error) throw error;

      // Log the manual publication
      await supabase
        .from('template_publishing_logs')
        .insert({
          template_id: offerId,
          action: 'published',
          published_at: new Date().toISOString(),
          staff_user_id: user?.id
        });

      toast({
        title: "Offer Published",
        description: "The offer template has been published manually.",
      });

      fetchOffers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || userRole !== 'staff') {
    return <Navigate to="/auth" replace />;
  }

  const scheduledOffers = offers.filter(offer => 
    offer.publish_at && !offer.is_published
  );
  
  const publishedOffers = offers.filter(offer => 
    offer.is_published
  );

  const upcomingOffers = offers.filter(offer => 
    !offer.publish_at && !offer.is_published
  );

  const getStatusBadge = (offer: ScheduledOffer) => {
    if (offer.is_published) {
      return <Badge variant="default">Published</Badge>;
    }
    if (offer.publish_at) {
      const publishTime = new Date(offer.publish_at);
      const now = new Date();
      if (publishTime <= now) {
        return <Badge variant="secondary">Pending Publication</Badge>;
      }
      return <Badge variant="outline">Scheduled</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const OfferTable = ({ offers, title, showActions = true }: { 
    offers: ScheduledOffer[], 
    title: string, 
    showActions?: boolean 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {offers.length} template{offers.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates in this category
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.type}</TableCell>
                  <TableCell>
                    {offer.publish_at ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(offer.publish_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    ) : offer.is_published ? (
                      <span className="text-muted-foreground">Published</span>
                    ) : (
                      <span className="text-muted-foreground">No schedule</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(offer)}</TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex gap-2">
                        {offer.publish_at && !offer.is_published && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualPublish(offer.id)}
                            >
                              Publish Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelScheduled(offer.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Staff Portal</h1>
                <p className="text-sm text-muted-foreground">Publishing Queue</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={view === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('calendar')}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Publishing Queue</h2>
          <p className="text-muted-foreground">
            Manage scheduled offer template publications and monitor live templates.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : view === 'table' ? (
          <div className="space-y-6">
            <OfferTable 
              offers={scheduledOffers} 
              title="Scheduled Offers" 
              showActions={true}
            />
            
            <OfferTable 
              offers={upcomingOffers} 
              title="Draft Templates" 
              showActions={true}
            />
            
            <OfferTable 
              offers={publishedOffers} 
              title="Published Templates" 
              showActions={false}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Publishing Calendar</CardTitle>
              <CardDescription>
                Calendar view of scheduled publications (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Calendar view will be implemented in the next iteration
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}