import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface SendOfferModalProps {
  user: UserProfile;
  institutionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendOfferModal: React.FC<SendOfferModalProps> = ({
  user,
  institutionId,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiry_date: undefined as Date | undefined,
    referral_bonus: '',
    offer_link: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    if (!formData.expiry_date) {
      setError('Expiry date is required');
      return;
    }

    setIsLoading(true);

    try {
      const offerData = {
        institution_id: institutionId,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        expiry_date: format(formData.expiry_date, 'yyyy-MM-dd'),
        referral_bonus: formData.referral_bonus ? parseInt(formData.referral_bonus) : null,
        offer_link: formData.offer_link || null
      };

      const { error: insertError } = await supabase
        .from('institution_offers')
        .insert([offerData]);

      if (insertError) throw insertError;

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Send Offer to {user.full_name || user.email}
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
            Create a personalized offer for this user
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Offer Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., $100 New Member Bonus"
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
              placeholder="Describe the offer details..."
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

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

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};