import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  const handleDemoLogin = async (demoUser: string) => {
    setLoading(true);
    try {
      const success = await login(demoUser);
      if (success) {
        toast({ title: `Welcome ${demoUser === 'admin' ? 'Parent Admin' : demoUser}!` });
        navigate('/dashboard');
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
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
                className="w-full gap-2"
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
                  onClick={() => handleDemoLogin('abigail')}
                  disabled={loading}
                >
                  Sign in as Abigail
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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