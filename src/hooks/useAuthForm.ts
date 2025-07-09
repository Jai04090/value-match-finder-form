import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RecaptchaWrapperRef } from '@/components/auth/RecaptchaWrapper';
import { validatePassword } from '@/utils/auth/passwordValidation';

export const useAuthForm = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [justCompletedSignup, setJustCompletedSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaWrapperRef>(null);
  
  // Additional registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [householdMembers, setHouseholdMembers] = useState('');
  const [zipCode, setZipCode] = useState('');

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

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Confirm password
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    // reCAPTCHA validation
    if (!recaptchaToken) {
      errors.push('Please complete the reCAPTCHA verification');
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

    // For login, require reCAPTCHA
    if (!isSignUp && !recaptchaToken) {
      toast({
        title: "Error",
        description: "Please complete the reCAPTCHA verification",
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
          recaptchaRef.current?.reset();
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
          recaptchaRef.current?.reset();
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
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setYearOfBirth('');
    setPhoneNumber('');
    setIncomeRange('');
    setHouseholdMembers('');
    setZipCode('');
    setRecaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setJustCompletedSignup(false); // Reset flag when switching modes
    resetForm();
  };

  return {
    // State
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
    // Functions
    handleSubmit,
    toggleMode
  };
};
