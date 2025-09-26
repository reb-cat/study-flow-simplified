import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Parse hash fragment for Supabase auth tokens
    const parseHashParams = (hash: string) => {
      const params = new URLSearchParams(hash.substring(1));
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        type: params.get('type')
      };
    };

    const hashParams = parseHashParams(window.location.hash);
    const { access_token, refresh_token, type } = hashParams;
    
    // Check if this is a password recovery and we have the necessary tokens
    if (type !== 'recovery' || !access_token || !refresh_token) {
      toast({
        title: 'Invalid reset link',
        description: 'This password reset link is invalid or has expired.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    // Set the session with the tokens from the hash
    supabase.auth.setSession({
      access_token,
      refresh_token
    });
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate inputs
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

      // Redirect to dashboard or login
      navigate('/dashboard');
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
        </div>

        {/* Reset password form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
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
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;