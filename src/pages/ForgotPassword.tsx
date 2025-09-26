import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .min(1, { message: "Email is required" })
    .max(255, { message: "Email must be less than 255 characters" }),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate email
      const validationResult = forgotPasswordSchema.safeParse({ email });
      
      if (!validationResult.success) {
        const fieldErrors: { email?: string } = {};
        validationResult.error.issues.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        validationResult.data.email,
        {
          redirectTo: `${window.location.origin}/reset-password`
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

      setSent(true);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
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
            </form>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;