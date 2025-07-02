import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [justCompletedSignup, setJustCompletedSignup] = useState(false);
  
  // Additional registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [householdMembers, setHouseholdMembers] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Redirect if already authenticated (but not if we just completed signup)
  React.useEffect(() => {
    console.log('Auth page - user state:', user?.email, 'justCompletedSignup:', justCompletedSignup);
    if (user && !justCompletedSignup) {
      console.log('User authenticated and not from signup, redirecting to home');
      navigate('/');
    }
  }, [user, navigate, justCompletedSignup]);

  const validateRegistrationForm = () => {
    const errors = [];
    
    if (!firstName.trim()) errors.push('First name is required');
    if (!lastName.trim()) errors.push('Last name is required');
    if (!yearOfBirth || parseInt(yearOfBirth) < 1900 || parseInt(yearOfBirth) > new Date().getFullYear()) {
      errors.push('Please enter a valid birth year');
    }
    if (!phoneNumber.trim()) errors.push('Phone number is required');
    if (!incomeRange) errors.push('Income range is required');
    if (!householdMembers || parseInt(householdMembers) < 1 || parseInt(householdMembers) > 10) {
      errors.push('Household members must be between 1 and 10');
    }
    if (!zipCode.trim() || !/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      errors.push('Please enter a valid zip code (e.g., 12345 or 12345-6789)');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', isSignUp ? 'SignUp' : 'SignIn', email);
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate additional fields for sign up
    if (isSignUp) {
      const validationErrors = validateRegistrationForm();
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors.join('. '),
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      let result;
      
      if (isSignUp) {
        console.log('Calling signUp...');
        setJustCompletedSignup(true); // Set flag before signup
        
        // Include additional user data in metadata for sign up
        result = await signUp(email, password, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          year_of_birth: parseInt(yearOfBirth),
          phone_number: phoneNumber.trim(),
          income_range: incomeRange,
          household_members: parseInt(householdMembers),
          zip_code: zipCode.trim()
        });
        
        console.log('SignUp completed, result:', result);
        
        if (result.error) {
          console.log('SignUp error:', result.error.message);
          setJustCompletedSignup(false); // Reset flag on error
          toast({
            title: "Error",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          console.log('SignUp successful - showing success message and switching to login');
          toast({
            title: "Registration Successful!",
            description: "Your account has been created. Please sign in with your credentials."
          });
          // Reset form and switch to login mode
          resetForm();
          setIsSignUp(false);
          // Keep justCompletedSignup true to prevent redirect
        }
      } else {
        console.log('Calling signIn...');
        setJustCompletedSignup(false); // Clear flag for normal signin
        result = await signIn(email, password);
        
        console.log('SignIn completed, result:', result);
        
        if (result.error) {
          console.log('SignIn error:', result.error.message);
          toast({
            title: "Error",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          console.log('SignIn successful');
          toast({
            title: "Success",
            description: "Logged in successfully!"
          });
          // Navigation will happen automatically via the useEffect above when user state changes
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setJustCompletedSignup(false); // Reset flag on error
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setYearOfBirth('');
    setPhoneNumber('');
    setIncomeRange('');
    setHouseholdMembers('');
    setZipCode('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setJustCompletedSignup(false); // Reset flag when switching modes
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Legal First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g., Ginho"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Legal Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g., Tam"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearOfBirth">Year of Birth</Label>
                    <Input
                      id="yearOfBirth"
                      type="number"
                      value={yearOfBirth}
                      onChange={(e) => setYearOfBirth(e.target.value)}
                      placeholder="e.g., 1999"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="householdMembers">Members in Household</Label>
                    <Input
                      id="householdMembers"
                      type="number"
                      value={householdMembers}
                      onChange={(e) => setHouseholdMembers(e.target.value)}
                      placeholder="1-10"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 123-456-7890"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="incomeRange">Income Range</Label>
                  <Select value={incomeRange} onValueChange={setIncomeRange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-25k">Under $25,000</SelectItem>
                      <SelectItem value="25k-49k">$25,000 - $49,999</SelectItem>
                      <SelectItem value="50k-74k">$50,000 - $74,999</SelectItem>
                      <SelectItem value="75k-99k">$75,000 - $99,999</SelectItem>
                      <SelectItem value="100k-plus">$100,000 and above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g., 12345"
                    required
                  />
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
