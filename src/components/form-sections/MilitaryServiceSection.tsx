
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { FormData } from '@/types/formTypes';

interface MilitaryServiceSectionProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
}

const MilitaryServiceSection: React.FC<MilitaryServiceSectionProps> = ({
  formData,
  onInputChange
}) => {
  const militaryBranches = ['Army', 'Navy', 'Coast Guard', 'Marine Corps', 'Air Force', 'Space Force'];

  return (
    <div className="space-y-6">
      {/* Military Service */}
      <div className="space-y-2">
        <Label htmlFor="currentOrFormerMilitary" className="text-sm font-medium flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          Current or Former Military
        </Label>
        <Select 
          value={formData.currentOrFormerMilitary} 
          onValueChange={(value) => onInputChange('currentOrFormerMilitary', value)}
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
          <Label htmlFor="militaryBranch" className="text-sm font-medium flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            Military Branch
          </Label>
          <Select 
            value={formData.militaryBranch} 
            onValueChange={(value) => onInputChange('militaryBranch', value)}
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
    </div>
  );
};

export default MilitaryServiceSection;
