import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { aromaAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[!@#$%&*]/, 'Password must contain at least one special character (!@#$%&*)')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '', '', '']);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Timer effect for resend code
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleSendVerification = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await aromaAPI.sendEmailCode({
        email,
        type: 1, // Registration type (1 = Registration, 0 = Password Reset)
      });

      if (response.success) {
        setIsVerificationSent(true);
        setCanResend(false);
        setResendTimer(120); // 2 minutes
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code",
        });
      } else {
        toast({
          title: "Failed to Send Code",
          description: response.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !email) return;

    setIsVerifying(true);
    try {
      const response = await aromaAPI.sendEmailCode({
        email,
        type: 1, // Registration type (1 = Registration, 0 = Password Reset)
      });

      if (response.success) {
        setCanResend(false);
        setResendTimer(120); // Reset to 2 minutes
        toast({
          title: "Code Resent",
          description: "Verification code has been resent to your email",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: response.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Resend verification code error:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    // Check if previous fields are filled (except for the first field)
    if (index > 0 && !verificationDigits[index - 1]) {
      return; // Don't allow filling if previous field is empty
    }

    const newDigits = [...verificationDigits];
    newDigits[index] = value;
    setVerificationDigits(newDigits);

    // Update form data
    const verificationCode = newDigits.join('');
    setValue('verificationCode', verificationCode);
    clearErrors('verificationCode');

    // Auto-focus next input if value entered and there's a next field
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, currentIndex: number) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text');
    
    // Extract only numbers from pasted data
    const numbersOnly = pastedData.replace(/\D/g, '');
    
    // Take only first 6 numbers
    const digitsToFill = numbersOnly.slice(0, 6);
    
    if (digitsToFill.length === 0) return;
    
    // Create new digits array
    const newDigits = [...verificationDigits];
    
    // Fill digits starting from current position
    const startIndex = currentIndex;
    for (let i = 0; i < digitsToFill.length && (startIndex + i) < 6; i++) {
      newDigits[startIndex + i] = digitsToFill[i];
    }
    
    setVerificationDigits(newDigits);
    
    // Update form data
    const verificationCode = newDigits.join('');
    setValue('verificationCode', verificationCode);
    clearErrors('verificationCode');
    
    // Show success indicator
    setPasteSuccess(true);
    setTimeout(() => setPasteSuccess(false), 1000);
    
    // Focus on the next empty field or the last filled field
    const nextEmptyIndex = newDigits.findIndex((digit, idx) => idx >= startIndex && !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + digitsToFill.length - 1, 5);
    
    setTimeout(() => {
      const nextInput = document.getElementById(`digit-${focusIndex}`);
      if (nextInput) {
        nextInput.focus();
        // Select all text for easy replacement
        (nextInput as HTMLInputElement).select();
      }
    }, 0);
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!verificationDigits[index] && index > 0) {
        // If current box is empty, move to previous box
        const prevInput = document.getElementById(`digit-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        // Clear current box and all subsequent boxes
        const newDigits = [...verificationDigits];
        for (let i = index; i < newDigits.length; i++) {
          newDigits[i] = '';
        }
        setVerificationDigits(newDigits);
        setValue('verificationCode', newDigits.join(''));
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      if (verificationDigits[index]) {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      const response = await aromaAPI.register({
        email: data.email,
        password: data.password, // Not required for registration
        username: data.username,
        validCode: data.verificationCode,
      });

      if (response.success && response.data) {
        // Show success state
        setIsRegistrationSuccess(true);
        
        toast({
          title: "Account Created Successfully!",
          description: "Welcome to AromaTech. You can now sign in.",
        });
        
        // Redirect to login page after a delay to allow user to see success message
        setTimeout(() => {
          window.location.href = '/';
        }, 3000); // 3 second delay
      } else {
        // Check if the error indicates account already exists
        const errorMessage = response.error || "";
        const isAccountExists = errorMessage.includes("账号已存在") || 
                               errorMessage.includes("account already exists") ||
                               errorMessage.includes("already exists");
        
        toast({
          title: isAccountExists ? "Account Already Exists" : "Registration Failed",
          description: isAccountExists 
            ? "An account with this email already exists. Please try signing in instead."
            : errorMessage || "Please check your information and try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check if the error response contains account exists message
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.message || "";
      const isAccountExists = errorMessage.includes("账号已存在") || 
                             errorMessage.includes("account already exists") ||
                             errorMessage.includes("already exists");
      
      toast({
        title: isAccountExists ? "Account Already Exists" : "Registration Error",
        description: isAccountExists 
          ? "An account with this email already exists. Please try signing in instead."
          : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join AromaTech to manage your aroma diffuser network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Choose a username"
                {...register('username')}
                className={cn(errors.username && 'border-destructive')}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            {/* Email field with verification button */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={cn(errors.email && 'border-destructive', 'flex-1')}
                />
                <Button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isVerifying || !email || resendTimer > 0}
                  size="sm"
                  className={cn(
                    "px-4",
                    resendTimer > 0 && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Send Code
                    </>
                  )}
                </Button>
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Email verification code field */}
            {isVerificationSent && (
              <div className="space-y-4">
                <Label className="text-center block">Verification Code</Label>
                <div className="flex justify-center gap-2 relative">
                  {verificationDigits.map((digit, index) => {
                    const isDisabled = index > 0 && !verificationDigits[index - 1];
                    return (
                      <Input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(index, e)}
                        onPaste={(e) => handlePaste(e, index)}
                        maxLength={1}
                        readOnly={isDisabled}
                        className={cn(
                          "w-12 h-12 text-center text-xl font-bold transition-all duration-200",
                          isDisabled && "cursor-not-allowed opacity-50",
                          pasteSuccess && "ring-2 ring-green-500 bg-green-50"
                        )}
                        style={{ fontFamily: 'monospace' }}
                      />
                    );
                  })}
                </div>
                {pasteSuccess && (
                  <div className="text-center">
                    <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Code pasted successfully!
                    </p>
                  </div>
                )}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendCode}
                      disabled={isVerifying}
                      className="text-sm"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        "Didn't receive code? Resend"
                      )}
                    </Button>
                  )}
                </div>
                {errors.verificationCode && (
                  <p className="text-sm text-destructive text-center">{errors.verificationCode.message}</p>
                )}
              </div>
            )}

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  {...register('password')}
                  className={cn(errors.password && 'border-destructive', 'pr-10')}
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...register('confirmPassword')}
                  className={cn(errors.confirmPassword && 'border-destructive', 'pr-10')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isVerificationSent}
            >
              {(isSubmitting || !isVerificationSent) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Success State */}
          {isRegistrationSuccess && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Account Created Successfully!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Welcome to AromaTech! You can now sign in with your credentials.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting to login page in a moment...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{' '}
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.location.href = '/'}>
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
