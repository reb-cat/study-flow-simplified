import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthConfirm = () => {
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!tokenHash || type !== 'recovery') {
          toast({
            title: 'Invalid confirmation link',
            description: 'This confirmation link is invalid or has expired.',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }

        // Verify the OTP token for password recovery
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (error) {
          console.error('Auth confirmation error:', error);
          toast({
            title: 'Confirmation failed',
            description: error.message || 'Failed to confirm authentication. Please try again.',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }

        if (data.session) {
          toast({
            title: 'Authentication confirmed',
            description: 'You can now reset your password.'
          });
          // Redirect to reset password page
          navigate('/reset-password');
        } else {
          toast({
            title: 'Session error',
            description: 'Failed to establish session. Please try again.',
            variant: 'destructive'
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth confirmation:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive'
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    handleAuthConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
        </div>

        {/* Confirmation status */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-center">
              {loading ? 'Confirming Authentication...' : 'Authentication Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Please wait while we confirm your authentication...
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Redirecting you to the appropriate page...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;