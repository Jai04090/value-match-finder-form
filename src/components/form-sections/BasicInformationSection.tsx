
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Building2, GraduationCap, Mail } from 'lucide-react';
import { FormData } from '@/types/formTypes';

interface BasicInformationSectionProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
}

const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-6">
      {/* Email Address */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium flex items-center">
          <Mail className="h-5 w-5 text-blue-600 mr-2" />
          Email Address *
        </Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="Enter your email address" 
          value={formData.email} 
          onChange={(e) => onInputChange('email', e.target.value)} 
          className="w-full" 
          required
        />
      </div>

      {/* Current Financial Institution */}
      <div className="space-y-2">
        <Label htmlFor="currentFinancialInstitution" className="text-sm font-medium flex items-center">
          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
          Current Financial Institution
        </Label>
        <Input 
          id="currentFinancialInstitution" 
          type="text" 
          placeholder="e.g., Chase Bank, Wells Fargo, Local Credit Union" 
          value={formData.currentFinancialInstitution} 
          onChange={(e) => onInputChange('currentFinancialInstitution', e.target.value)} 
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
          onChange={(e) => onInputChange('lookingFor', e.target.value)} 
          className="w-full min-h-[100px] resize-y" 
        />
      </div>

      {/* Current Employer */}
      <div className="space-y-2">
        <Label htmlFor="currentEmployer" className="text-sm font-medium flex items-center">
          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
          Current Employer
        </Label>
        <Input 
          id="currentEmployer" 
          type="text" 
          placeholder="e.g., Microsoft, Local School District, Self-employed" 
          value={formData.currentEmployer} 
          onChange={(e) => onInputChange('currentEmployer', e.target.value)} 
          className="w-full" 
        />
      </div>

      {/* Student or Alumni */}
      <div className="space-y-2">
        <Label htmlFor="studentOrAlumni" className="text-sm font-medium flex items-center">
          <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
          Student or Alumni
        </Label>
        <Input 
          id="studentOrAlumni" 
          type="text" 
          placeholder="e.g., University of Michigan, Harvard Business School, Currently at UCLA" 
          value={formData.studentOrAlumni} 
          onChange={(e) => onInputChange('studentOrAlumni', e.target.value)} 
          className="w-full" 
        />
      </div>
    </div>
  );
};

export default BasicInformationSection;
