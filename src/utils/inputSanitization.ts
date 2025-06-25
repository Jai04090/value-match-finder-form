
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags and scripts
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Trim whitespace and limit length
  return sanitized.trim().slice(0, 1000);
};

export const validateInputLength = (input: string, maxLength: number = 500): boolean => {
  return input.length <= maxLength;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const containsSuspiciousPatterns = (input: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};
