import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Users, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Institution {
  id: string;
  full_name: string;
  email: string;
  institution_name: string;
  institution_type: string;
  location: string;
  phone_number: string;
  created_at: string;
}

const StaffInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'institution')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInstitutions(data || []);
    } catch (error: any) {
      console.error('Error fetching institutions:', error);
      toast({
        title: "Error",
        description: "Failed to load institutions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInstitutionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'bank': 'bg-blue-100 text-blue-800',
      'credit_union': 'bg-green-100 text-green-800',
      'fintech': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors['other'];
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Partner Institutions</h1>
          <p className="text-muted-foreground">
            Manage and monitor your institutional partnerships
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Partners
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{institutions.length}</div>
              <p className="text-xs text-muted-foreground">
                Active institutional partnerships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Templates
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* This will be fetched from database in a future update */}
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Templates in use by institutions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Offers Sent
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* This will be fetched from database in a future update */}
                -
              </div>
              <p className="text-xs text-muted-foreground">
                Total offers created
              </p>
            </CardContent>
          </Card>
        </div>

        {institutions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Institutions Yet</h3>
              <p className="text-muted-foreground mb-4">
                No institutional partners have registered yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {institutions.map((institution) => (
              <Card key={institution.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {institution.institution_name || institution.full_name}
                        </CardTitle>
                        <CardDescription>
                          {institution.institution_type && (
                            <Badge variant="secondary" className={getInstitutionTypeColor(institution.institution_type)}>
                              {institution.institution_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(institution.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{institution.email}</span>
                    </div>
                    {institution.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{institution.phone_number}</span>
                      </div>
                    )}
                    {institution.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{institution.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      View Offers
                    </Button>
                    <Button variant="outline" size="sm">
                      <Target className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffInstitutions;