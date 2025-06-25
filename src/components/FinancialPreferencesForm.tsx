
import React, { useState } from 'react';
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
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
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
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    
    if (isSubmitting) {
      console.log('Already submitting, preventing duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('form_submissions')
        .select('count(*)', { count: 'exact', head: true });
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('Supabase connection successful');

      // Sanitize form data
      console.log('Sanitizing form data...');
      const sanitizedData = sanitizeFormData(formData);
      console.log('Sanitized data:', sanitizedData);
      
      // Validate form data
      console.log('Validating form data...');
      const errors = validateForm(sanitizedData);
      if (errors.length > 0) {
        console.error('Validation errors:', errors);
        toast({
          title: "Validation Error",
          description: errors.join(' '),
          variant: "destructive"
        });
        return;
      }

      // Prepare data for database insertion
      const submissionData = {
        current_financial_institution: sanitizedData.currentFinancialInstitution || null,
        looking_for: sanitizedData.lookingFor || null,
        religious_organization: sanitizedData.religiousOrganization || null,
        sharia_compliant: sanitizedData.shariaCompliant,
        current_employer: sanitizedData.currentEmployer || null,
        student_or_alumni: sanitizedData.studentOrAlumni || null,
        current_or_former_military: sanitizedData.currentOrFormerMilitary || null,
        military_branch: sanitizedData.militaryBranch || null,
        environmental_initiatives: sanitizedData.environmentalInitiatives,
        diversity_equity_inclusion: sanitizedData.diversityEquityInclusion,
        religion: sanitizedData.religion || null,
        submission_ip: null, // Could be populated server-side if needed
        user_agent: navigator.userAgent
      };

      console.log('Prepared submission data:', submissionData);

      // Insert data into Supabase
      console.log('Inserting data into Supabase...');
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([submissionData])
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase insertion error:', error);
        throw new Error(`Failed to save form submission: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insertion');
        throw new Error('No data was returned after insertion');
      }

      console.log('Data successfully inserted:', data);

      // Filter out empty string values for cleaner logging
      const cleanedData = Object.entries(sanitizedData).reduce((acc, [key, value]) => {
        if (typeof value === 'string' && value.trim() !== '') {
          acc[key] = value;
        } else if (typeof value === 'boolean' && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Secure logging - only log summary in production
      const summary = createFormSubmissionSummary(cleanedData);
      secureLog.formSubmission(summary);
      secureLog.info('Form Data (Development Only)', cleanedData);
      secureLog.info('Submission saved to database with ID:', data?.[0]?.id);

      // Reset form after successful submission
      setFormData({
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

      toast({
        title: "Form Submitted Successfully",
        description: `Your preferences have been saved securely to our database. Submission ID: ${data[0].id}`
      });

      console.log('Form submission completed successfully');
    } catch (error) {
      console.error('Form submission error:', error);
      secureLog.error('Form submission error', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "An error occurred while submitting the form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
