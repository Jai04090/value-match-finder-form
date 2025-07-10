import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  approval_status: string;
  created_by: string;
  created_at: string;
  rejection_reason?: string;
}

interface TemplateApprovalCardProps {
  template: Template;
  onStatusChange: () => void;
}

export const TemplateApprovalCard: React.FC<TemplateApprovalCardProps> = ({
  template,
  onStatusChange
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_templates')
        .update({
          approval_status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      // Send notification to template creator
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'template_approved',
          userId: template.created_by,
          title: 'Template Approved',
          message: `Your template "${template.name}" has been approved and is now available for institutions to use.`,
          metadata: { templateId: template.id },
          sendEmail: true
        }
      });

      toast({
        title: "Template Approved",
        description: "The template has been approved successfully.",
      });

      onStatusChange();
    } catch (error: any) {
      console.error('Error approving template:', error);
      toast({
        title: "Error",
        description: "Failed to approve template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this template.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_templates')
        .update({
          approval_status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', template.id);

      if (error) throw error;

      // Send notification to template creator
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'template_rejected',
          userId: template.created_by,
          title: 'Template Rejected',
          message: `Your template "${template.name}" has been rejected. Reason: ${rejectionReason}`,
          metadata: { templateId: template.id, rejectionReason },
          sendEmail: true
        }
      });

      toast({
        title: "Template Rejected",
        description: "The template has been rejected and the creator has been notified.",
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      onStatusChange();
    } catch (error: any) {
      console.error('Error rejecting template:', error);
      toast({
        title: "Error",
        description: "Failed to reject template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-3 w-3" />;
      case 'rejected': return <X className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{template.type.toUpperCase()}</Badge>
              <Badge variant="secondary" className={getStatusColor(template.approval_status)}>
                {getStatusIcon(template.approval_status)}
                <span className="ml-1">{template.approval_status.toUpperCase()}</span>
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            Created {new Date(template.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {template.description}
        </p>

        {template.approval_status === 'rejected' && template.rejection_reason && (
          <Alert className="mb-4">
            <X className="h-4 w-4" />
            <AlertDescription>
              <strong>Rejection Reason:</strong> {template.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{template.name}</DialogTitle>
                <DialogDescription>
                  Template Details and Content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Type</h4>
                  <Badge variant="secondary">{template.type}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={getStatusColor(template.approval_status)}>
                    {getStatusIcon(template.approval_status)}
                    <span className="ml-1">{template.approval_status.toUpperCase()}</span>
                  </Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {template.approval_status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Template</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejecting this template. This will be sent to the creator.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRejectDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={loading || !rejectionReason.trim()}
                        className="flex-1"
                      >
                        {loading ? 'Rejecting...' : 'Reject Template'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};