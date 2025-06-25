
import { FormData } from '@/types/formTypes';

export const validateForm = (formData: FormData): string[] => {
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
