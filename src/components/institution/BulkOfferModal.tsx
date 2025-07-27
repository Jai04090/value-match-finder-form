import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Send, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_student?: boolean;
  dei_preference?: boolean;
  green_banking_interest?: boolean;
}

interface OfferTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  reward_details: string;
  offer_link: string;
  expiry_date: string;
  allowed_filters: any;
  eligibility_criteria: string;
}

interface BulkOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: UserProfile[];
  institutionId: string;
  onSuccess: () => void;
}

interface BulkOfferProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const BulkOfferModal: React.FC<BulkOfferModalProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  institutionId,
  onSuccess
}) => {
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OfferTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customOfferLink, setCustomOfferLink] = useState('');
  const [referralBonus, setReferralBonus] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<BulkOfferProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<'template' | 'customize' | 'preview' | 'sending'>('template');
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      resetForm();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_published', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load offer templates",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setCustomTitle('');
    setCustomDescription('');
    setCustomOfferLink('');
    setReferralBonus(null);
    setExpiryDate('');
    setProgress(null);
    setCurrentStep('template');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setCustomTitle(template.name);
      setCustomDescription(template.description || '');
      setCustomOfferLink(template.offer_link || '');
      setExpiryDate(template.expiry_date || '');
      setCurrentStep('customize');
    }
  };

  const validateTargeting = () => {
    if (!selectedTemplate?.allowed_filters) return true;
    
    const allowedFilters = selectedTemplate.allowed_filters;
    const incompatibleUsers = selectedUsers.filter(user => {
      if (allowedFilters.is_student && !user.is_student) return true;
      if (allowedFilters.dei_preference && !user.dei_preference) return true;
      if (allowedFilters.green_banking_interest && !user.green_banking_interest) return true;
      return false;
    });

    return incompatibleUsers.length === 0;
  };

  const handleSendBulkOffer = async () => {
    if (!selectedTemplate || !customTitle.trim()) {
      toast({
        title: "Error",
        description: "Please select a template and provide a title",
        variant: "destructive",
      });
      return;
    }

    if (!validateTargeting()) {
      toast({
        title: "Targeting Mismatch",
        description: "Some selected users don't match the template's targeting criteria",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep('sending');
    setProgress({
      total: selectedUsers.length,
      completed: 0,
      failed: 0,
      status: 'processing'
    });

    try {
      // Create bulk offer record
      const { data: bulkOffer, error: bulkError } = await supabase
        .from('bulk_offers')
        .insert({
          institution_id: institutionId,
          template_id: selectedTemplate.id,
          title: customTitle,
          description: customDescription,
          total_recipients: selectedUsers.length,
          targeting_filters: selectedTemplate.allowed_filters || {}
        })
        .select()
        .single();

      if (bulkError) throw bulkError;

      // Process each user
      let completed = 0;
      let failed = 0;

      for (const user of selectedUsers) {
        try {
          // Create individual offer
          const { error: offerError } = await supabase
            .from('institution_offers')
            .insert({
              institution_id: institutionId,
              user_id: user.id,
              bulk_offer_id: bulkOffer.id,
              title: customTitle,
              description: customDescription,
              offer_link: customOfferLink,
              referral_bonus: referralBonus,
              expiry_date: expiryDate || null,
              template_id: selectedTemplate.id
            });

          if (offerError) throw offerError;

          // Send email notification
          const { error: emailError } = await supabase.functions.invoke('send-offer-email', {
            body: {
              userEmail: user.email,
              userName: user.full_name || user.email,
              offerTitle: customTitle,
              offerDescription: customDescription,
              offerLink: customOfferLink,
              referralBonus: referralBonus,
              expiryDate: expiryDate,
              institutionName: 'Your Institution' // You might want to fetch this
            }
          });

          if (emailError) {
            console.warn('Email sending failed for user:', user.email, emailError);
          }

          completed++;
        } catch (userError) {
          console.error('Failed to process user:', user.email, userError);
          failed++;
        }

        // Update progress
        setProgress(prev => prev ? {
          ...prev,
          completed: completed,
          failed: failed
        } : null);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update bulk offer status
      await supabase
        .from('bulk_offers')
        .update({
          successful_sends: completed,
          failed_sends: failed,
          status: failed === 0 ? 'completed' : (completed === 0 ? 'failed' : 'completed'),
          completed_at: new Date().toISOString()
        })
        .eq('id', bulkOffer.id);

      setProgress(prev => prev ? {
        ...prev,
        status: failed === 0 ? 'completed' : (completed === 0 ? 'failed' : 'completed')
      } : null);

      toast({
        title: "Bulk Offer Sent",
        description: `Successfully sent to ${completed} users${failed > 0 ? `, ${failed} failed` : ''}`,
        variant: completed > 0 ? "default" : "destructive",
      });

      if (completed > 0) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error sending bulk offer:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk offer",
        variant: "destructive",
      });
      
      setProgress(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Select Offer Template</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose a pre-approved template to send to {selectedUsers.length} selected users
        </p>
      </div>
      
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge variant="secondary">{template.type}</Badge>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires: {template.expiry_date || 'No expiry'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomization = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customize Your Offer</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {selectedUsers.length} recipients
        </Badge>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="customTitle">Offer Title</Label>
          <Input
            id="customTitle"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Enter offer title"
          />
        </div>

        <div>
          <Label htmlFor="customDescription">Description</Label>
          <Textarea
            id="customDescription"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            placeholder="Customize the offer description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="referralBonus">Referral Bonus ($)</Label>
            <Input
              id="referralBonus"
              type="number"
              value={referralBonus || ''}
              onChange={(e) => setReferralBonus(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="customOfferLink">Offer Link</Label>
          <Input
            id="customOfferLink"
            value={customOfferLink}
            onChange={(e) => setCustomOfferLink(e.target.value)}
            placeholder="https://your-institution.com/offer"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('template')}
          className="flex-1"
        >
          Back to Templates
        </Button>
        <Button 
          onClick={() => setCurrentStep('preview')}
          className="flex-1"
          disabled={!customTitle.trim()}
        >
          Preview & Send
        </Button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review & Send</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{customTitle}</CardTitle>
          <CardDescription>{customDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {referralBonus && (
              <p><strong>Referral Bonus:</strong> ${referralBonus}</p>
            )}
            {expiryDate && (
              <p><strong>Expires:</strong> {new Date(expiryDate).toLocaleDateString()}</p>
            )}
            {customOfferLink && (
              <p><strong>Offer Link:</strong> {customOfferLink}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-3 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Recipients:</span>
          <span>{selectedUsers.length} users</span>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('customize')}
          className="flex-1"
        >
          Back to Edit
        </Button>
        <Button 
          onClick={handleSendBulkOffer}
          disabled={isLoading}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          Send to All Users
        </Button>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Sending Bulk Offer</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we send your offer to all selected users...
        </p>
      </div>

      {progress && (
        <div className="space-y-3">
          <Progress 
            value={(progress.completed + progress.failed) / progress.total * 100} 
            className="w-full"
          />
          
          <div className="flex justify-between text-sm">
            <span>Progress: {progress.completed + progress.failed} / {progress.total}</span>
            <span>{Math.round((progress.completed + progress.failed) / progress.total * 100)}%</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-3 w-3" />
              Total: {progress.total}
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Sent: {progress.completed}
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" />
              Failed: {progress.failed}
            </div>
          </div>

          {progress.status === 'completed' && (
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Bulk offer sent successfully!</span>
              </div>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}

          {progress.status === 'failed' && (
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Bulk offer failed</span>
              </div>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Bulk Offer</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {currentStep === 'template' && renderTemplateSelection()}
          {currentStep === 'customize' && renderCustomization()}
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'sending' && renderProgress()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOfferModal;