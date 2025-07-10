import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Users, Shield, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AllowedFilters {
  is_student?: boolean;
  dei_preference?: boolean;
  green_banking_interest?: boolean;
  is_military?: boolean;
  zip_codes?: boolean;
}

export default function StaffCreateOffer() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    eligibility_criteria: '',
    reward_details: '',
    expiry_date: undefined as Date | undefined,
    offer_link: ''
  });

  const [allowedFilters, setAllowedFilters] = useState<AllowedFilters>({
    is_student: false,
    dei_preference: false,
    green_banking_interest: false,
    is_military: false,
    zip_codes: false
  });

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (filter: keyof AllowedFilters, checked: boolean) => {
    setAllowedFilters(prev => ({ ...prev, [filter]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.type) {
      setError('Name and type are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const templateData = {
        type: formData.type,
        name: formData.name,
        description: formData.description || null,
        eligibility_criteria: formData.eligibility_criteria || null,
        reward_details: formData.reward_details || null,
        expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : null,
        offer_link: formData.offer_link || null,
        allowed_filters: allowedFilters as any,
        created_by: user?.id
      };

      const { error: insertError } = await supabase
        .from('offer_templates')
        .insert([templateData]);

      if (insertError) throw insertError;

      toast({
        title: "Template Created",
        description: "Offer template has been created successfully.",
      });

      // Reset form
      setFormData({
        type: '',
        name: '',
        description: '',
        eligibility_criteria: '',
        reward_details: '',
        expiry_date: undefined,
        offer_link: ''
      });
      setAllowedFilters({
        is_student: false,
        dei_preference: false,
        green_banking_interest: false,
        is_military: false,
        zip_codes: false
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create offer template');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Staff Portal</h1>
                <p className="text-sm text-muted-foreground">Create Offer Templates</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Create Offer Template</h2>
          <p className="text-muted-foreground">
            Build compliance-safe offer templates that financial institutions can use to create targeted offers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Define the offer template structure and permitted targeting filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium text-foreground">
                    Offer Type *
                  </label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="e.g., referral_bonus, student_incentive"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Template Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., $50 for You, $50 for Them"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the offer details..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="eligibility_criteria" className="text-sm font-medium text-foreground">
                  Eligibility Criteria
                </label>
                <Textarea
                  id="eligibility_criteria"
                  value={formData.eligibility_criteria}
                  onChange={(e) => handleInputChange('eligibility_criteria', e.target.value)}
                  placeholder="e.g., Must be a student or DEI-supportive member"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reward_details" className="text-sm font-medium text-foreground">
                  Reward Details
                </label>
                <Textarea
                  id="reward_details"
                  value={formData.reward_details}
                  onChange={(e) => handleInputChange('reward_details', e.target.value)}
                  placeholder="e.g., $50 cash bonus for new account opening"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Expiration Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expiry_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiry_date ? (
                          format(formData.expiry_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expiry_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label htmlFor="offer_link" className="text-sm font-medium text-foreground">
                    Offer Link Template
                  </label>
                  <Input
                    id="offer_link"
                    type="url"
                    value={formData.offer_link}
                    onChange={(e) => handleInputChange('offer_link', e.target.value)}
                    placeholder="https://your-institution.com/offer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Permitted Targeting Filters</h3>
                <p className="text-sm text-muted-foreground">
                  Select which filters institutions can use when targeting users with this offer template.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_student"
                      checked={allowedFilters.is_student}
                      onCheckedChange={(checked) => handleFilterChange('is_student', checked as boolean)}
                    />
                    <label htmlFor="is_student" className="text-sm font-medium text-foreground">
                      Student Status
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dei_preference"
                      checked={allowedFilters.dei_preference}
                      onCheckedChange={(checked) => handleFilterChange('dei_preference', checked as boolean)}
                    />
                    <label htmlFor="dei_preference" className="text-sm font-medium text-foreground">
                      DEI Preference
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="green_banking_interest"
                      checked={allowedFilters.green_banking_interest}
                      onCheckedChange={(checked) => handleFilterChange('green_banking_interest', checked as boolean)}
                    />
                    <label htmlFor="green_banking_interest" className="text-sm font-medium text-foreground">
                      Green Banking Interest
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_military"
                      checked={allowedFilters.is_military}
                      onCheckedChange={(checked) => handleFilterChange('is_military', checked as boolean)}
                    />
                    <label htmlFor="is_military" className="text-sm font-medium text-foreground">
                      Military Status
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="zip_codes"
                      checked={allowedFilters.zip_codes}
                      onCheckedChange={(checked) => handleFilterChange('zip_codes', checked as boolean)}
                    />
                    <label htmlFor="zip_codes" className="text-sm font-medium text-foreground">
                      ZIP Code Targeting
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Creating Template...' : 'Create Template'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}