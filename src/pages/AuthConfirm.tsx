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
      const type = searchParams.get('type');

      // Validate required parameters
      if (!tokenHash || !type) {
        setStatus('error');
        setMessage('Invalid confirmation link. Missing token or type parameter.');
        toast({
          title: 'Invalid Link',
          description: 'The confirmation link is missing required parameters.',
          variant: 'destructive'
        });
        return;
      }

      try {
        // Handle different types of OTP verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'recovery' | 'email' | 'magiclink' | 'email_change' | 'invite'
        });

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

        if (data.user) {
          setStatus('success');

          // Handle different confirmation types
          switch (type) {
            case 'recovery':
              setMessage('Password recovery confirmed! You can now sign in with your new password.');
              toast({
                title: 'Password Recovery Confirmed',
                description: 'You can now sign in with your new password.'
              });
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

          // Try to log the user in to the app context
          if (data.user.email) {
            const loginSuccess = await login(data.user.email);
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