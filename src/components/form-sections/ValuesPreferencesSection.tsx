
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Leaf, Users } from 'lucide-react';
import { FormData } from '@/types/formTypes';

interface ValuesPreferencesSectionProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
}

const ValuesPreferencesSection: React.FC<ValuesPreferencesSectionProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="space-y-6">
      {/* Environmental Initiatives */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="environmentalInitiatives" 
          checked={formData.environmentalInitiatives} 
          onCheckedChange={(checked) => onInputChange('environmentalInitiatives', checked as boolean)} 
        />
        <Label htmlFor="environmentalInitiatives" className="text-sm font-medium cursor-pointer flex items-center">
          <Leaf className="h-5 w-5 text-blue-600 mr-2" />
          Environmental and Green Initiatives
        </Label>
      </div>

      {/* Diversity, Equity, and Inclusion */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="diversityEquityInclusion" 
          checked={formData.diversityEquityInclusion} 
          onCheckedChange={(checked) => onInputChange('diversityEquityInclusion', checked as boolean)} 
        />
        <Label htmlFor="diversityEquityInclusion" className="text-sm font-medium cursor-pointer flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          Diversity, Equity, and Inclusion (DEI)
        </Label>
      </div>
    </div>
  );
};

export default ValuesPreferencesSection;
