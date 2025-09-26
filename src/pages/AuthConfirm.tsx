import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'reset-password'>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const confirmAuth = async () => {
      const tokenHash = searchParams.get('token_hash');
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const codeVerifier = searchParams.get('code_verifier');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      console.log('Current URL:', window.location.href);
      console.log('Auth confirmation params:', { 
        tokenHash, 
        token, 
        code, 
        codeVerifier, 
        type, 
        accessToken, 
        refreshToken,
        allParams: Object.fromEntries(searchParams.entries())
      });

      try {
        let data, error;

        // Check if we have PKCE flow parameters (code + code_verifier)
        if (code && codeVerifier) {
          console.log('Attempting PKCE flow with code exchange');
          // Handle PKCE flow
          const result = await supabase.auth.exchangeCodeForSession(code);
          data = result.data;
          error = result.error;
        }
        // Check if we have access_token and refresh_token (direct token flow)
        else if (accessToken && refreshToken) {
          console.log('Attempting direct token session setup');
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          data = result.data;
          error = result.error;
        }
        // Check if we have token_hash for OTP verification (custom URLs)
        else if (tokenHash && type) {
          console.log('Attempting token_hash verification for type:', type);
          // Handle token_hash verification
          const result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'recovery' | 'email' | 'magiclink' | 'email_change' | 'invite'
          });
          data = result.data;
          error = result.error;
        }
        // Handle missing parameters
        else {
          console.error('Missing auth parameters:', { tokenHash, token, code, type, accessToken, refreshToken });
          setStatus('error');
          setMessage('Invalid confirmation link. Please check that you clicked the correct link from your email.');
          toast({
            title: 'Invalid Link',
            description: 'The confirmation link appears to be invalid or incomplete. Please try requesting a new reset link.',
            variant: 'destructive'
          });
          return;
        }

        if (error) {
          console.error('Auth confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm authentication.');
          toast({
            title: 'Confirmation Failed',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        if (data.user || data.session) {
          console.log('Auth success - user/session found:', { type, user: data.user, session: data.session });
          setStatus('success');

          // Handle password recovery flow first - bypass normal login
          if (type === 'recovery') {
            console.log('Password recovery confirmed - showing reset password form');
            setStatus('reset-password');
            setMessage('Email verified! Please set your new password.');
            toast({
              title: 'Email Verified',
              description: 'Please set your new password to complete the recovery.'
            });
            return; // Don't continue with normal login flow
          }

          // Determine the flow type and set appropriate messaging for other flows
          if (code && codeVerifier) {
            // PKCE flow - typically for OAuth or magic links
            setMessage('Authentication successful! Welcome back to StudyFlow.');
            toast({
              title: 'Sign In Successful',
              description: 'Welcome back to StudyFlow!'
            });
          } else {
            // Handle different OTP confirmation types
            switch (type) {
              case 'email':
                setMessage('Email confirmed successfully! You can now access your account.');
                toast({
                  title: 'Email Confirmed',
                  description: 'Your email has been verified successfully.'
                });
                break;
              case 'magiclink':
                setMessage('Magic link authentication successful!');
                toast({
                  title: 'Sign In Successful',
                  description: 'Welcome back to StudyFlow!'
                });
                break;
              case 'email_change':
                setMessage('Email change confirmed successfully!');
                toast({
                  title: 'Email Updated',
                  description: 'Your email address has been updated.'
                });
                break;
              case 'invite':
                setMessage('Invitation accepted! Welcome to StudyFlow!');
                toast({
                  title: 'Welcome!',
                  description: 'Your invitation has been accepted.'
                });
                break;
              default:
                setMessage('Authentication confirmed successfully!');
                toast({
                  title: 'Confirmed',
                  description: 'Authentication successful.'
                });
            }
          }

          // Try to log the user in to the app context
          const user = data.user || data.session?.user;
          if (user?.email) {
            const loginSuccess = await login(user.email);
            if (loginSuccess) {
              // Redirect to dashboard after successful login
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } else {
              // If app context login fails, still redirect to login page
              setTimeout(() => {
                navigate('/');
              }, 2000);
            }
          }
        } else {
          setStatus('error');
          setMessage('Confirmation completed but no user data received.');
          toast({
            title: 'Incomplete Confirmation',
            description: 'Please try signing in manually.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Unexpected error during confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during confirmation.');
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        });
      }
    };

    confirmAuth();
  }, [searchParams, navigate, login]);

  const handleGoToLogin = () => {
    navigate('/');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setErrors({});

    try {
      const validationResult = resetPasswordSchema.safeParse({ password, confirmPassword });
      
      if (!validationResult.success) {
        const fieldErrors: { password?: string; confirmPassword?: string } = {};
        validationResult.error.issues.forEach((err) => {
          if (err.path[0] === 'password') fieldErrors.password = err.message;
          if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: validationResult.data.password
      });

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Password reset successful',
        description: 'Your password has been updated successfully.'
      });

      setStatus('success');
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="card-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Confirming...'}
              {status === 'success' && 'Confirmation Successful'}
              {status === 'error' && 'Confirmation Failed'}
              {status === 'reset-password' && 'Reset Your Password'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'reset-password' ? (
              // Reset Password Form
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex justify-center">
                  <div className="text-6xl">🔐</div>
                </div>
                
                <p className="text-center text-muted-foreground">{message}</p>
                
                <div className="space-y-1">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    required
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                    aria-invalid={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            ) : (
              // Status Display  
              <>
                <div className="flex justify-center">
                  {status === 'loading' && (
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  )}
                  {status === 'success' && (
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  )}
                  {status === 'error' && (
                    <XCircle className="w-16 h-16 text-red-600" />
                  )}
                </div>

                <p className="text-center text-muted-foreground">
                  {message}
                </p>

                <div className="space-y-2">
                  {status === 'success' && (
                    <Button onClick={handleGoToDashboard} className="w-full">
                      Go to Dashboard
                    </Button>
                  )}
                  {status === 'error' && (
                    <Button onClick={handleGoToLogin} className="w-full">
                      Go to Login
                    </Button>
                  )}
                  {status === 'loading' && (
                    <Button disabled className="w-full">
                      Processing...
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;