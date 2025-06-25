
import { z } from 'zod';
import { FormData } from '@/types/formTypes';
import { sanitizeInput, validateInputLength, containsSuspiciousPatterns } from './inputSanitization';

// Zod schema for comprehensive validation
const FormDataSchema = z.object({
  currentFinancialInstitution: z.string()
    .max(200, 'Financial institution name too long')
    .optional()
    .or(z.literal('')),
  lookingFor: z.string()
    .max(1000, 'Description too long')
    .optional()
    .or(z.literal('')),
  religiousOrganization: z.string()
    .max(100, 'Religious organization name too long')
    .optional()
    .or(z.literal('')),
  shariaCompliant: z.boolean(),
  currentEmployer: z.string()
    .max(200, 'Employer name too long')
    .optional()
    .or(z.literal('')),
  studentOrAlumni: z.string()
    .max(200, 'Institution name too long')
    .optional()
    .or(z.literal('')),
  currentOrFormerMilitary: z.string()
    .max(10, 'Invalid military status')
    .optional()
    .or(z.literal('')),
  militaryBranch: z.string()
    .max(50, 'Military branch name too long')
    .optional()
    .or(z.literal('')),
  environmentalInitiatives: z.boolean(),
  diversityEquityInclusion: z.boolean(),
  religion: z.string()
    .max(100, 'Religion name too long')
    .optional()
    .or(z.literal(''))
});

export const validateForm = (formData: FormData): string[] => {
  const errors: string[] = [];

  try {
    // Validate with Zod schema
    FormDataSchema.parse(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => err.message));
    }
  }

  // Security validation for string fields
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() !== '') {
      // Check for suspicious patterns
      if (containsSuspiciousPatterns(value)) {
        errors.push(`Invalid characters detected in ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }

      // Validate length based on field type
      const maxLength = key === 'lookingFor' ? 1000 : 200;
      if (!validateInputLength(value, maxLength)) {
        errors.push(`${key.replace(/([A-Z])/g, ' $1')} is too long`);
      }
    }
  });

  // Specific validation: if military is Yes, branch should be selected
  if (formData.currentOrFormerMilitary === 'Yes' && !formData.militaryBranch) {
    errors.push('Please select a military branch since you indicated military service.');
  }
  
  return errors;
};

export const sanitizeFormData = (formData: FormData): FormData => {
  const sanitized = { ...formData };
  
  // Sanitize all string fields
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key as keyof FormData];
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeInput(value);
    }
  });
  
  return sanitized;
};
