import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Eye, Calendar, Tag, ExternalLink, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// Removed unused import

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  eligibility_criteria: string;
  reward_details: string;
  offer_link: string;
  expiry_date: string;
  allowed_filters: any;
  created_at: string;
  created_by: string;
}

const InstitutionTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'referral': 'bg-blue-100 text-blue-800',
      'promotional': 'bg-green-100 text-green-800',
      'seasonal': 'bg-orange-100 text-orange-800',
      'targeted': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const isExpired = (expiryDate: string) => {
    return expiryDate && new Date(expiryDate) < new Date();
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Available Offer Templates</h1>
          <p className="text-muted-foreground">
            Browse and use pre-approved offer templates for your campaigns
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Templates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Templates
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.filter(t => !isExpired(t.expiry_date)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Not expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Template Types
              </CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(templates.map(t => t.type)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different categories
              </p>
            </CardContent>
          </Card>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Templates Available</h3>
              <p className="text-muted-foreground mb-4">
                No offer templates have been created yet. Contact staff to create templates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className={getTypeColor(template.type)}>
                          {template.type.toUpperCase()}
                        </Badge>
                        {template.expiry_date && (
                          <Badge 
                            variant={isExpired(template.expiry_date) ? "destructive" : "outline"}
                            className="ml-2"
                          >
                            {isExpired(template.expiry_date) ? "Expired" : "Active"}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {template.description}
                  </p>
                  
                  {template.expiry_date && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires: {new Date(template.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
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
                            <Badge variant="secondary" className={getTypeColor(template.type)}>
                              {template.type.toUpperCase()}
                            </Badge>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          {template.eligibility_criteria && (
                            <div>
                              <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                              <p className="text-sm text-muted-foreground">{template.eligibility_criteria}</p>
                            </div>
                          )}
                          {template.reward_details && (
                            <div>
                              <h4 className="font-medium mb-2">Reward Details</h4>
                              <p className="text-sm text-muted-foreground">{template.reward_details}</p>
                            </div>
                          )}
                          {template.offer_link && (
                            <div>
                              <h4 className="font-medium mb-2">Offer Link</h4>
                              <a 
                                href={template.offer_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {template.offer_link}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      onClick={() => {
                        toast({
                          title: "Template Selected",
                          description: "Contact staff to set up campaigns with this template",
                        });
                      }}
                      disabled={isExpired(template.expiry_date)}
                    >
                      Select Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal removed for now - templates can be selected for staff coordination */}
      </div>
    </div>
  );
};

export default InstitutionTemplates;