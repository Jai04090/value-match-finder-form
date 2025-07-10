import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_student: boolean;
  green_banking_interest: boolean;
  dei_preference: boolean;
}

interface OfferTemplate {
  id: string;
  type: string;
  name: string;
  description: string | null;
  eligibility_criteria: string | null;
  reward_details: string | null;
  expiry_date: string | null;
  offer_link: string | null;
  allowed_filters: any;
}

interface TemplatedSendOfferModalProps {
  user: UserProfile;
  institutionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TemplatedSendOfferModal: React.FC<TemplatedSendOfferModalProps> = ({
  user,
  institutionId,
  onClose,
  onSuccess
}) => {
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OfferTemplate | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiry_date: undefined as Date | undefined,
    referral_bonus: '',
    offer_link: ''
  });
  const [targetingFilters, setTargetingFilters] = useState({
    is_student: false,
    dei_preference: false,
    green_banking_interest: false,
    is_military: false,
    zip_codes: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        title: template.name,
        description: template.description || '',
        expiry_date: template.expiry_date ? new Date(template.expiry_date) : undefined,
        referral_bonus: '',
        offer_link: template.offer_link || ''
      });
      // Reset targeting filters
      setTargetingFilters({
        is_student: false,
        dei_preference: false,
        green_banking_interest: false,
        is_military: false,
        zip_codes: false
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTemplate) {
      setError('Please select an offer template');
      return;
    }

    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    if (!formData.expiry_date) {
      setError('Expiry date is required');
      return;
    }

    // Validate targeting filters against template permissions
    const allowedFilters = selectedTemplate.allowed_filters || {};
    const activeFilters = Object.entries(targetingFilters).filter(([_, value]) => value);
    
    for (const [filter, _] of activeFilters) {
      if (!allowedFilters[filter]) {
        setError(`Filter "${filter}" is not permitted for this offer template`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const offerData = {
        institution_id: institutionId,
        user_id: user.id,
        template_id: selectedTemplate.id,
        title: formData.title,
        description: formData.description,
        expiry_date: format(formData.expiry_date, 'yyyy-MM-dd'),
        referral_bonus: formData.referral_bonus ? parseInt(formData.referral_bonus) : null,
        offer_link: formData.offer_link || null
      };

      const { data: insertedOffer, error: insertError } = await supabase
        .from('institution_offers')
        .insert([offerData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-offer-email', {
        body: {
          offerId: insertedOffer.id,
          userEmail: user.email,
          userName: user.full_name,
          institutionName: 'Financial Institution',
          offerTitle: formData.title,
          offerDescription: formData.description,
          offerLink: formData.offer_link,
          referralBonus: formData.referral_bonus ? parseInt(formData.referral_bonus) : null,
          expiryDate: format(formData.expiry_date, 'yyyy-MM-dd')
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send offer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (filter: string, checked: boolean) => {
    setTargetingFilters(prev => ({ ...prev, [filter]: checked }));
  };

  const getFilterLabel = (filter: string) => {
    const labels: { [key: string]: string } = {
      is_student: 'Student Status',
      dei_preference: 'DEI Preference',
      green_banking_interest: 'Green Banking Interest',
      is_military: 'Military Status',
      zip_codes: 'ZIP Code Targeting'
    };
    return labels[filter] || filter;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Send Templated Offer to {user.full_name || user.email}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Choose from pre-approved offer templates and customize the details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select Offer Template *
              </label>
              {templatesLoading ? (
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              ) : (
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an offer template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.type}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Details</h4>
                {selectedTemplate.description && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedTemplate.description}</p>
                )}
                {selectedTemplate.eligibility_criteria && (
                  <p className="text-sm"><strong>Eligibility:</strong> {selectedTemplate.eligibility_criteria}</p>
                )}
                {selectedTemplate.reward_details && (
                  <p className="text-sm"><strong>Rewards:</strong> {selectedTemplate.reward_details}</p>
                )}
              </div>
            )}
          </div>

          {selectedTemplate && (
            <>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-foreground">
                  Offer Title *
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Customize the offer title"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Customize the offer description..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Expiry Date *
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="referral_bonus" className="text-sm font-medium text-foreground">
                    Referral Bonus ($)
                  </label>
                  <Input
                    id="referral_bonus"
                    type="number"
                    value={formData.referral_bonus}
                    onChange={(e) => handleInputChange('referral_bonus', e.target.value)}
                    placeholder="50"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="offer_link" className="text-sm font-medium text-foreground">
                    Offer Link
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

              {selectedTemplate.allowed_filters && Object.keys(selectedTemplate.allowed_filters).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Targeting Filters</h4>
                  <p className="text-xs text-muted-foreground">
                    Apply additional targeting based on user preferences (optional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedTemplate.allowed_filters).map(([filter, allowed]) => {
                      if (!allowed) return null;
                      return (
                        <div key={filter} className="flex items-center space-x-2">
                          <Checkbox
                            id={filter}
                            checked={targetingFilters[filter as keyof typeof targetingFilters]}
                            onCheckedChange={(checked) => handleFilterChange(filter, checked as boolean)}
                          />
                          <label htmlFor={filter} className="text-sm text-foreground">
                            {getFilterLabel(filter)}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedTemplate} className="flex-1">
              {isLoading ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};