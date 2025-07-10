import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RecaptchaWrapper } from '@/components/auth/RecaptchaWrapper';
import { AuthFormHeader } from '@/components/auth/AuthFormHeader';
import { AuthFormFields } from '@/components/auth/AuthFormFields';
import { SignupFields } from '@/components/auth/SignupFields';
import { AuthFormToggle } from '@/components/auth/AuthFormToggle';
import { useAuthForm } from '@/hooks/useAuthForm';

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    isSignUp,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    justCompletedSignup,
    showPassword,
    setShowPassword,
    confirmPassword,
    setConfirmPassword,
    recaptchaToken,
    setRecaptchaToken,
    recaptchaRef,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    yearOfBirth,
    setYearOfBirth,
    phoneNumber,
    setPhoneNumber,
    incomeRange,
    setIncomeRange,
    householdMembers,
    setHouseholdMembers,
    zipCode,
    setZipCode,
    handleSubmit,
    toggleMode
  } = useAuthForm();

  // Redirect if already authenticated (but not if we just completed signup)
  React.useEffect(() => {
    console.log('Auth page - user state:', user?.email, 'justCompletedSignup:', justCompletedSignup);
    if (user && !justCompletedSignup) {
      console.log('User authenticated and not from signup, redirecting to home');
      navigate('/');
    }
  }, [user, navigate, justCompletedSignup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <AuthFormHeader isSignUp={isSignUp} />
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthFormFields
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isSignUp={isSignUp}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
            />
            
            {isSignUp && (
              <SignupFields
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                yearOfBirth={yearOfBirth}
                setYearOfBirth={setYearOfBirth}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                incomeRange={incomeRange}
                setIncomeRange={setIncomeRange}
                householdMembers={householdMembers}
                setHouseholdMembers={setHouseholdMembers}
                zipCode={zipCode}
                setZipCode={setZipCode}
              />
            )}

            {/* reCAPTCHA */}
            <div className="flex justify-center">
            <RecaptchaWrapper
              ref={recaptchaRef}
              siteKey="6LcvLH4rAAAAALs18XmRYKy5uaKtXMgj7Uyro4xD"
              onVerify={setRecaptchaToken}
                onError={() => {
                  toast({
                    title: "reCAPTCHA Error",
                    description: "Failed to verify reCAPTCHA. Please try again.",
                    variant: "destructive"
                  });
                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                  toast({
                    title: "reCAPTCHA Expired",
                    description: "Please complete the reCAPTCHA again.",
                    variant: "destructive"
                  });
                }}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          
          <AuthFormToggle isSignUp={isSignUp} onToggle={toggleMode} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
