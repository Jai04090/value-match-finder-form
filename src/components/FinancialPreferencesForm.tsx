import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FormData } from '@/types/formTypes';
import { validateForm, sanitizeFormData } from '@/utils/formValidation';
import { secureLog, createFormSubmissionSummary } from '@/utils/secureLogging';
import { supabase } from '@/integrations/supabase/client';
import BasicInformationSection from '@/components/form-sections/BasicInformationSection';
import ReligiousPreferencesSection from '@/components/form-sections/ReligiousPreferencesSection';
import MilitaryServiceSection from '@/components/form-sections/MilitaryServiceSection';
import ValuesPreferencesSection from '@/components/form-sections/ValuesPreferencesSection';

const FinancialPreferencesForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your preferences.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, navigate, toast]);

  const [formData, setFormData] = useState<FormData>({
    email: user?.email || '',
    currentFinancialInstitution: '',
    lookingFor: '',
    religiousOrganization: '',
    shariaCompliant: false,
    currentEmployer: '',
    studentOrAlumni: '',
    currentOrFormerMilitary: '',
    militaryBranch: '',
    environmentalInitiatives: false,
    diversityEquityInclusion: false,
    religion: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset military branch if military status changes to No
      ...(field === 'currentOrFormerMilitary' && value === 'No' ? { militaryBranch: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit preferences.",
        variant: "destructive"
      });
      return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);
      
      // Validate form data
      const errors = validateForm(sanitizedData);
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join(' '),
          variant: "destructive"
        });
        return;
      }

      // Prepare data for database insertion
      const submissionData = {
        user_id: user.id,
        email: sanitizedData.email || null,
        current_financial_institution: sanitizedData.currentFinancialInstitution || null,
        looking_for: sanitizedData.lookingFor || null,
        current_employer: sanitizedData.currentEmployer || null,
        student_or_alumni: sanitizedData.studentOrAlumni || null,
        religious_organization: sanitizedData.religiousOrganization || null,
        sharia_compliant: sanitizedData.shariaCompliant,
        religion: sanitizedData.religion || null,
        current_or_former_military: sanitizedData.currentOrFormerMilitary || null,
        military_branch: sanitizedData.militaryBranch || null,
        environmental_initiatives: sanitizedData.environmentalInitiatives,
        diversity_equity_inclusion: sanitizedData.diversityEquityInclusion,
        submission_ip: null,
        user_agent: navigator.userAgent
      };

      // Save to Supabase
      const { error } = await supabase
        .from('form_submissions')
        .insert([submissionData]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Failed to save form submission');
      }

      // Log success (for development/debugging)
      const summary = createFormSubmissionSummary(sanitizedData);
      secureLog.formSubmission(summary);
      secureLog.info('Form Data saved to database successfully');

      toast({
        title: "Form Submitted Successfully",
        description: "Your preferences have been recorded securely."
      });

      // Navigate to preferences page
      navigate('/preferences');

    } catch (error) {
      secureLog.error('Form submission error', error);
      toast({
        title: "Submission Error",
        description: "An error occurred while submitting the form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Financial Institution Preferences
            </CardTitle>
            <CardDescription className="text-gray-600">
              Help us match you with banks or credit unions that align with your values and background
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <BasicInformationSection 
                formData={formData} 
                onInputChange={handleInputChange} 
              />
              
              <ReligiousPreferencesSection 
                formData={formData} 
                onInputChange={handleInputChange} 
              />
              
              <MilitaryServiceSection 
                formData={formData} 
                onInputChange={handleInputChange} 
              />
              
              <ValuesPreferencesSection 
                formData={formData} 
                onInputChange={handleInputChange} 
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Preferences'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialPreferencesForm;
