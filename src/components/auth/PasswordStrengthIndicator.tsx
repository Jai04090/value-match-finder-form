import React from 'react';
import { Progress } from '@/components/ui/progress';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/utils/auth/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  const validation = validatePassword(password);
  
  const getProgressValue = () => {
    switch (validation.strength) {
      case 'weak': return 25;
      case 'medium': return 50;
      case 'strong': return 75;
      case 'very-strong': return 100;
      default: return 0;
    }
  };

  const getProgressColor = () => {
    switch (validation.strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength:</span>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(validation.strength)}`}>
          {getPasswordStrengthText(validation.strength)}
        </span>
      </div>
      
      <Progress value={getProgressValue()} className="h-2">
        <div 
          className={`h-full transition-all ${getProgressColor()}`}
          style={{ width: `${getProgressValue()}%` }}
        />
      </Progress>

      {showRequirements && validation.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-500 flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && (
        <div className="flex items-center text-sm text-green-600">
          <span className="w-1 h-1 bg-green-600 rounded-full mr-2" />
          Password meets all requirements
        </div>
      )}
    </div>
  );
};