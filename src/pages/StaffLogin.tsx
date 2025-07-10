import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';

const StaffLogin = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp) {
      if (!firstName || !lastName) {
        toast({
          title: "Error",
          description: "Please fill in your name",
          variant: "destructive"
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      let result;
      
      if (isSignUp) {
        // Create staff account with role metadata
        result = await signUp(email, password, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'staff'
        });
        
        if (result.error) {
          toast({
            title: "Registration Failed",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Registration Successful!",
            description: "Your staff account has been created. Please sign in with your credentials."
          });
          // Switch to login mode after successful registration
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
          setFirstName('');
          setLastName('');
        }
      } else {
        result = await signIn(email, password);
        
        if (result.error) {
          toast({
            title: "Login Failed",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Logged in successfully!"
          });
          // Navigation will be handled by ProtectedRoute based on role
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Staff Portal</CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Create your staff account to access the portal'
              : 'Sign in to access the staff dashboard'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      disabled={loading}
                      required={isSignUp}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      disabled={loading}
                      required={isSignUp}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your staff email"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  required={isSignUp}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading 
                ? (isSignUp ? "Creating Account..." : "Signing in...") 
                : (isSignUp ? "Create Staff Account" : "Sign In")
              }
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="text-sm"
            >
              {isSignUp 
                ? 'Already have a staff account? Sign in'
                : "Don't have a staff account? Create one"
              }
            </Button>
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <div className="space-y-2">
              <div>
                <Link 
                  to="/auth" 
                  className="text-primary hover:underline"
                >
                  Regular User Login
                </Link>
              </div>
              <div>
                <Link 
                  to="/institution-login" 
                  className="text-primary hover:underline"
                >
                  Institution Login
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLogin;