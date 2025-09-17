import React from 'react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Timer, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { 
    currentUser, 
    selectedProfile, 
    profiles, 
    setSelectedProfile, 
    activeTimer, 
    logout 
  } = useApp();
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) return null;

  const studentProfiles = profiles.filter(p => p.role === 'student');

  return (
    <header className="bg-surface border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: App Name */}
        <div>
          <h1 className="text-2xl font-bold text-primary">StudyFlow</h1>
          <p className="text-sm text-muted-foreground">Mission Hub</p>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
          {/* Active Timer Indicator */}
          {activeTimer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/timer')}
              className="gap-2"
            >
              <div className="w-2 h-2 bg-timer rounded-full animate-pulse" />
              <Timer className="w-4 h-4" />
              {formatTime(activeTimer.elapsedTime)}
            </Button>
          )}

          {/* Student Switcher (Admin only) */}
          {currentUser.role === 'admin' && (
            <Select
              value={selectedProfile?.id || ''}
              onValueChange={(value) => {
                const profile = profiles.find(p => p.id === value);
                if (profile) setSelectedProfile(profile);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {studentProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Role Badge */}
          <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
            {currentUser.role === 'admin' ? 'Admin' : 'Student'}
          </Badge>

          {/* Current User */}
          <span className="text-sm text-muted-foreground">
            {currentUser.username}
          </span>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout */}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};