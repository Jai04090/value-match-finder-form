import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuthFormHeaderProps {
  isSignUp: boolean;
}

export const AuthFormHeader: React.FC<AuthFormHeaderProps> = ({ isSignUp }) => {
  return (
    <CardHeader className="text-center">
      <CardTitle className="text-2xl font-bold">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </CardTitle>
      <CardDescription>
        {isSignUp 
          ? 'Sign up to save your financial preferences'
          : 'Sign in to your account'
        }
      </CardDescription>
    </CardHeader>
  );
};