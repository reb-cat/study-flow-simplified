import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Users, Rocket } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        toast({ title: 'Welcome to StudyFlow!' });
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'Login failed', 
          description: 'Please check your credentials and try again.',
          variant: 'destructive'
        });
      }
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

  const handleDemoLogin = async (profileName: string) => {
    setLoading(true);

    const email = `demo-${profileName.toLowerCase()}@studyflow.demo`;
    console.log('Demo login starting for profileName:', profileName);
    console.log('Current username state:', username);
    console.log('Login attempt:', email, 'with password: demo');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'demo'
      });

      if (error) {
        console.error('Supabase auth error:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        toast({
          title: 'Demo login failed',
          description: `${error.message} (Code: ${error.code})`,
          variant: 'destructive'
        });
        return;
      }

      console.log('Auth successful:', data);

      if (data.user) {
        // Session persists through reloads automatically
        console.log('Calling AppContext login with profile name:', profileName);
        console.log('Type of profileName:', typeof profileName, 'Value:', JSON.stringify(profileName));
        const success = await login(profileName);
        console.log('AppContext login result:', success);
        if (success) {
          toast({
            title: `Welcome ${profileName === 'admin' ? 'Parent Admin' : profileName}!`,
            description: 'Authenticated with Supabase'
          });
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
      console.error('Demo login error:', error);
      toast({
        title: 'Error',
        description: 'Demo login failed.',
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
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">StudyFlow</h1>
          <p className="text-muted-foreground">Your focused weekly planner with built-in timers</p>
        </div>

        {/* Login Card */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access StudyFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or try demo mode</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 relative z-10"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
              >
                <Users className="w-4 h-4" />
                Sign in as Admin
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative z-10"
                  onClick={() => handleDemoLogin('abigail')}
                  disabled={loading}
                >
                  Sign in as Abigail
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative z-10"
                  onClick={() => handleDemoLogin('khalil')}
                  disabled={loading}
                >
                  Sign in as Khalil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Info */}
        <Card className="bg-accent/50 border-accent">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo Mode:</strong> Works fully offline with sample data. Perfect for exploring all features without setup.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;