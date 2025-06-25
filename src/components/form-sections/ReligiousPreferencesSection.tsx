
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormData } from '@/types/formTypes';

interface ReligiousPreferencesSectionProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
}

const ReligiousPreferencesSection: React.FC<ReligiousPreferencesSectionProps> = ({
  formData,
  onInputChange
}) => {
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

  const religions = ['Catholic', 'Evangelical', 'Islam', 'Hindu', 'Jewish', 'Other'];

  return (
    <div className="space-y-6">
      {/* Religious Organization */}
      <div className="space-y-2">
        <Label htmlFor="religiousOrganization" className="text-sm font-medium">
          Religious Organization
        </Label>
        <Select 
          value={formData.religiousOrganization} 
          onValueChange={(value) => onInputChange('religiousOrganization', value)}
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

      {/* Sharia-Compliant Banking Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="shariaCompliant" 
          checked={formData.shariaCompliant}
          onCheckedChange={(checked) => onInputChange('shariaCompliant', checked as boolean)}
        />
        <Label htmlFor="shariaCompliant" className="text-sm font-medium cursor-pointer">
          Sharia-Compliant Banking (Interest-Free)
        </Label>
      </div>

      {/* Religion */}
      <div className="space-y-2">
        <Label htmlFor="religion" className="text-sm font-medium">
          Religion
        </Label>
        <Select 
          value={formData.religion} 
          onValueChange={(value) => onInputChange('religion', value)}
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
    </div>
  );
};

export default ReligiousPreferencesSection;
