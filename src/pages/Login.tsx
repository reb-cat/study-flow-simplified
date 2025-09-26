import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Security: Input validation schema
const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .min(1, { message: "Email is required" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Security: Validate inputs before submission
      const validationResult = loginSchema.safeParse({ email, password });
      
      if (!validationResult.success) {
        const fieldErrors: { email?: string; password?: string } = {};
        validationResult.error.issues.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password
      });

      if (error) {
        // Security: Don't expose detailed auth errors to prevent enumeration
        const userFriendlyMessage = error.message.includes('Invalid login credentials') 
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
          
        toast({
          title: 'Login failed',
          description: userFriendlyMessage,
          variant: 'destructive'
        });
        return;
      }

      if (data.user) {
        const success = await login(validationResult.data.email);
        if (success) {
          toast({ title: 'Welcome to StudyFlow!' });
          navigate('/dashboard');
        } else {
          toast({
            title: 'Profile setup failed',
            description: 'Authentication succeeded but profile loading failed',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      // Security: Don't log sensitive information in production
      console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validationResult = z.object({
        email: z.string().trim().email({ message: "Please enter a valid email address" })
      }).safeParse({ email });
      
      if (!validationResult.success) {
        setErrors({ email: validationResult.error.issues[0]?.message || "Invalid email" });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        validationResult.data.email,
        {
          redirectTo: `${window.location.origin}/verify`
        }
      );

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to send reset email. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setResetEmailSent(true);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
          </div>
          <Card className="card-elevated">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-6xl">📧</div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground">
                We've sent password reset instructions to {email}
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setResetEmailSent(false);
                  setIsForgotPassword(false);
                }}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
      <div className="login-container w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
        </div>

        {/* Main form */}
        <Card className="card-elevated">
          <CardContent className="pt-6">
            {isForgotPassword ? (
              // Forgot password form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold">Reset Your Password</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter your email to receive reset instructions
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              // Login form
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Login;