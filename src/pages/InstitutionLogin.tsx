import React, { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RecaptchaWrapper, type RecaptchaWrapperRef } from '@/components/auth/RecaptchaWrapper';
import { validateEmail } from '@/utils/auth/authValidation';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InstitutionLogin: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Sign in user
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
        .select('role, full_name')
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
        description: `Welcome back, ${profile.full_name || 'Institution'}!`,
      });

    } catch (err: any) {
      setError(err.message || 'Login failed');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-yellowTint flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Institution Portal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your financial institution dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

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