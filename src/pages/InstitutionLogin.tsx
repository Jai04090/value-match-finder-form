import React, { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecaptchaWrapper, type RecaptchaWrapperRef } from '@/components/auth/RecaptchaWrapper';
import { validateEmail } from '@/utils/auth/authValidation';
import { validatePassword } from '@/utils/auth/passwordValidation';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstitutionLogin: React.FC = () => {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaWrapperRef>(null);
  const { toast } = useToast();

  // If user is already logged in, check their role
  if (user) {
    return <Navigate to="/institution-dashboard" replace />;
  }

  const validateZipCode = (zip: string): boolean => {
    return /^\d{5}$/.test(zip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (isSignUp) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors[0]);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (!institutionName.trim()) {
        setError('Institution name is required');
        return;
      }

      if (!institutionType) {
        setError('Institution type is required');
        return;
      }

      if (!validateZipCode(zipCode)) {
        setError('Please enter a valid 5-digit zip code');
        return;
      }
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
      // Verify reCAPTCHA
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: recaptchaToken }
      });

      if (verifyError || !verifyData?.success) {
        throw new Error('reCAPTCHA verification failed');
      }

      if (isSignUp) {
        // Sign up new institution
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/institution-login`,
            data: {
              institution_name: institutionName,
              institution_type: institutionType,
              zip_code: zipCode,
              role: 'institution'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          // Insert profile data
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email: email,
              role: 'institution',
              institution_name: institutionName,
              institution_type: institutionType,
              zip_code: zipCode,
              full_name: institutionName
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw new Error('Failed to create institution profile');
          }

          toast({
            title: "Account Created",
            description: `Welcome, ${institutionName}! Please check your email to verify your account.`,
          });
        }
      } else {
        // Sign in existing institution
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        // Check if user has institution role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, institution_name')
          .eq('id', signInData.user.id)
          .single();

        if (profileError) {
          throw new Error('Failed to verify user role');
        }

        if (profile.role !== 'institution') {
          await supabase.auth.signOut();
          throw new Error('Access denied. This portal is for financial institutions only.');
        }

        toast({
          title: "Login Successful",
          description: `Welcome back, ${profile.institution_name || profile.full_name || 'Institution'}!`,
        });
      }

    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Signup failed' : 'Login failed'));
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setInstitutionName('');
    setInstitutionType('');
    setZipCode('');
    recaptchaRef.current?.reset();
    setRecaptchaToken(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? 'Create Institution Account' : 'Institution Portal'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp 
              ? 'Register your financial institution to start connecting with users'
              : 'Sign in to access your financial institution dashboard'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="institutionName" className="text-sm font-medium text-foreground">
                  Institution Name
                </label>
                <Input
                  id="institutionName"
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="First National Bank"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="institution@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="institutionType" className="text-sm font-medium text-foreground">
                    Institution Type
                  </label>
                  <Select value={institutionType} onValueChange={setInstitutionType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Credit Union">Credit Union</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="zipCode" className="text-sm font-medium text-foreground">
                    Zip Code
                  </label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="12345"
                    maxLength={5}
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-center">
              <RecaptchaWrapper
                ref={recaptchaRef}
                siteKey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onVerify={setRecaptchaToken}
                onError={() => {
                  setError('reCAPTCHA error. Please try again.');
                  setRecaptchaToken(null);
                }}
                onExpired={() => {
                  setError('reCAPTCHA expired. Please verify again.');
                  setRecaptchaToken(null);
                }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:text-primary/80 underline text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link 
              to="/auth" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Not an institution? User login →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionLogin;