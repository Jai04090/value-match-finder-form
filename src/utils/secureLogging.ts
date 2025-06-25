
const isDevelopment = import.meta.env.DEV;

export const secureLog = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  
  // For form submissions, log only non-sensitive summary
  formSubmission: (summary: string) => {
    if (isDevelopment) {
      console.log(`[FORM] ${summary}`);
    }
  }
};

export const createFormSubmissionSummary = (formData: any): string => {
  const fieldsCompleted = Object.values(formData).filter(value => 
    (typeof value === 'string' && value.trim() !== '') || 
    (typeof value === 'boolean' && value === true)
  ).length;
  
  return `Form submitted with ${fieldsCompleted} fields completed`;
};
