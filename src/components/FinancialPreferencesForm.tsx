import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  currentFinancialInstitution: string;
  lookingFor: string;
  religiousOrganization: string;
  shariaCompliant: boolean;
  currentEmployer: string;
  studentOrAlumni: string;
  currentOrFormerMilitary: string;
  militaryBranch: string;
  environmentalInitiatives: boolean;
  diversityEquityInclusion: boolean;
  religion: string;
}

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
    religion: '',
  });

  const religiousOrganizations = [
    'Catholic',
    'Evangelical', 
    'Pentacostal/Assembly of God',
    'Lutheran',
    'Seventh-day Adventist',
    'Mennonite',
    'Islam',
    'Jewish',
    'Hindu',
    'Sharia-Compliant (Interest-Free Banking)',
    'Other'
  ];

  const militaryBranches = [
    'Army',
    'Navy',
    'Coast Guard',
    'Marine Corps',
    'Air Force',
    'Space Force'
  ];

  const religions = [
    'Catholic',
    'Evangelical',
    'Islam',
    'Hindu',
    'Jewish',
    'Other'
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset military branch if military status changes to No
      ...(field === 'currentOrFormerMilitary' && value === 'No' ? { militaryBranch: '' } : {})
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Check for empty string values in filled fields
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() === '' && value !== '') {
        // This catches cases where user selected something then cleared it
        return;
      }
    });

    // Specific validation: if military is Yes, branch should be selected
    if (formData.currentOrFormerMilitary === 'Yes' && !formData.militaryBranch) {
      errors.push('Please select a military branch since you indicated military service.');
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(' '),
        variant: "destructive",
      });
      return;
    }

    // Filter out empty string values for cleaner output
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim() !== '') {
        acc[key] = value;
      } else if (typeof value === 'boolean' && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    console.log('Form Data:', cleanedData);
    
    toast({
      title: "Form Submitted Successfully",
      description: "Your preferences have been recorded. Check the console for details.",
    });
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Financial Institution */}
              <div className="space-y-2">
                <Label htmlFor="currentFinancialInstitution" className="text-sm font-medium">
                  Current Financial Institution
                </Label>
                <Input
                  id="currentFinancialInstitution"
                  type="text"
                  placeholder="e.g., Chase Bank, Wells Fargo, Local Credit Union"
                  value={formData.currentFinancialInstitution}
                  onChange={(e) => handleInputChange('currentFinancialInstitution', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* What are you looking for */}
              <div className="space-y-2">
                <Label htmlFor="lookingFor" className="text-sm font-medium">
                  What are you looking for in a bank or credit union?
                </Label>
                <Textarea
                  id="lookingFor"
                  placeholder="Describe your priorities, such as low fees, ethical practices, community involvement, specific services, etc."
                  value={formData.lookingFor}
                  onChange={(e) => handleInputChange('lookingFor', e.target.value)}
                  className="w-full min-h-[100px] resize-y"
                />
              </div>

              {/* Religious Organization */}
              <div className="space-y-2">
                <Label htmlFor="religiousOrganization" className="text-sm font-medium">
                  Religious Organization
                </Label>
                <Select 
                  value={formData.religiousOrganization} 
                  onValueChange={(value) => handleInputChange('religiousOrganization', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your religious organization" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    {religiousOrganizations.map((org) => (
                      <SelectItem key={org} value={org} className="hover:bg-gray-100">
                        {org}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sharia-Compliant Banking */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shariaCompliant"
                  checked={formData.shariaCompliant}
                  onCheckedChange={(checked) => handleInputChange('shariaCompliant', checked as boolean)}
                />
                <Label htmlFor="shariaCompliant" className="text-sm font-medium cursor-pointer">
                  Sharia-Compliant (Interest-Free Banking)
                </Label>
              </div>

              {/* Current Employer */}
              <div className="space-y-2">
                <Label htmlFor="currentEmployer" className="text-sm font-medium">
                  Current Employer
                </Label>
                <Input
                  id="currentEmployer"
                  type="text"
                  placeholder="e.g., Microsoft, Local School District, Self-employed"
                  value={formData.currentEmployer}
                  onChange={(e) => handleInputChange('currentEmployer', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Student or Alumni */}
              <div className="space-y-2">
                <Label htmlFor="studentOrAlumni" className="text-sm font-medium">
                  Student or Alumni
                </Label>
                <Input
                  id="studentOrAlumni"
                  type="text"
                  placeholder="e.g., University of Michigan, Harvard Business School, Currently at UCLA"
                  value={formData.studentOrAlumni}
                  onChange={(e) => handleInputChange('studentOrAlumni', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Military Service */}
              <div className="space-y-2">
                <Label htmlFor="currentOrFormerMilitary" className="text-sm font-medium">
                  Current or Former Military
                </Label>
                <Select 
                  value={formData.currentOrFormerMilitary} 
                  onValueChange={(value) => handleInputChange('currentOrFormerMilitary', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Yes or No" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    <SelectItem value="Yes" className="hover:bg-gray-100">Yes</SelectItem>
                    <SelectItem value="No" className="hover:bg-gray-100">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Military Branch - Conditional */}
              {formData.currentOrFormerMilitary === 'Yes' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="militaryBranch" className="text-sm font-medium">
                    Military Branch
                  </Label>
                  <Select 
                    value={formData.militaryBranch} 
                    onValueChange={(value) => handleInputChange('militaryBranch', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your military branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      {militaryBranches.map((branch) => (
                        <SelectItem key={branch} value={branch} className="hover:bg-gray-100">
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Environmental Initiatives */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="environmentalInitiatives"
                  checked={formData.environmentalInitiatives}
                  onCheckedChange={(checked) => handleInputChange('environmentalInitiatives', checked as boolean)}
                />
                <Label htmlFor="environmentalInitiatives" className="text-sm font-medium cursor-pointer">
                  Environmental and Green Initiatives
                </Label>
              </div>

              {/* Diversity, Equity, and Inclusion */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diversityEquityInclusion"
                  checked={formData.diversityEquityInclusion}
                  onCheckedChange={(checked) => handleInputChange('diversityEquityInclusion', checked as boolean)}
                />
                <Label htmlFor="diversityEquityInclusion" className="text-sm font-medium cursor-pointer">
                  Diversity, Equity, and Inclusion (DEI)
                </Label>
              </div>

              {/* Religion */}
              <div className="space-y-2">
                <Label htmlFor="religion" className="text-sm font-medium">
                  Religion
                </Label>
                <Select 
                  value={formData.religion} 
                  onValueChange={(value) => handleInputChange('religion', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your religion" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    {religions.map((religion) => (
                      <SelectItem key={religion} value={religion} className="hover:bg-gray-100">
                        {religion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Submit Preferences
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
