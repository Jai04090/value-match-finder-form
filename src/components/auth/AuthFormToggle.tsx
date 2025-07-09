import React from 'react';

interface AuthFormToggleProps {
  isSignUp: boolean;
  onToggle: () => void;
}

export const AuthFormToggle: React.FC<AuthFormToggleProps> = ({ isSignUp, onToggle }) => {
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {isSignUp 
          ? 'Already have an account? Sign in'
          : "Don't have an account? Sign up"
        }
      </button>
    </div>
  );
};