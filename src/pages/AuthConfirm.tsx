import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmAuth = async () => {
      const tokenHash = searchParams.get('token_hash');
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const codeVerifier = searchParams.get('code_verifier');
      const type = searchParams.get('type');

      console.log('Auth confirmation params:', { tokenHash, token, code, type });

      try {
        let data, error;

        // Check if we have PKCE flow parameters (code + code_verifier)
        if (code && codeVerifier) {
          // Handle PKCE flow
          const result = await supabase.auth.exchangeCodeForSession(code);
          data = result.data;
          error = result.error;
        }
        // Check if we have token_hash for OTP verification (custom URLs)
        if (tokenHash && type) {
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
          console.error('Missing auth parameters:', { tokenHash, token, code, type });
          setStatus('error');
          setMessage('Invalid confirmation link. Missing required parameters.');
          toast({
            title: 'Invalid Link',
            description: 'The confirmation link is missing required parameters.',
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
          setStatus('success');

          // Determine the flow type and set appropriate messaging
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
              case 'recovery':
                setMessage('Email verified! Please set your new password.');
                toast({
                  title: 'Email Verified',
                  description: 'Please set your new password to complete the recovery.'
                });
                // Redirect to password reset page instead of dashboard
                setTimeout(() => {
                  navigate('/reset-password');
                }, 2000);
                return; // Don't continue with normal login flow
                break;
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
                navigate('/login');
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
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;