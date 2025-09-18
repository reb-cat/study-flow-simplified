import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ScheduleSpine } from '@/components/ScheduleSpine';
import { useApp } from '@/context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

export default function Schedule() {
  const { selectedProfile } = useApp();
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 1 }); // Start week on Monday
  });

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6 max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground">Please select a student profile to view their schedule.</p>
          </div>
        </main>
      </div>
    );
  }

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(currentWeek);
    day.setDate(currentWeek.getDate() + i);
    return day;
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeek(newWeek);
  };

  const getWeekRange = () => {
    const sunday = new Date(currentWeek);
    sunday.setDate(currentWeek.getDate() + 6);
    return `${format(currentWeek, 'MMM d')} - ${format(sunday, 'MMM d, yyyy')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Spine</h1>
            <p className="text-muted-foreground">
              {selectedProfile.displayName} • Week of {getWeekRange()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
              Previous Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              Next Week
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {weekDays.map((day) => (
            <ScheduleSpine
              key={day.toISOString()}
              studentName={selectedProfile.displayName}
              date={day}
              showAddButtons={true}
            />
          ))}
        </div>

        {/* Explanation */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">How the Schedule Spine Works</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Fixed blocks</strong> (Co-op, Bible, Lunch) show their scheduled subjects</li>
            <li>• <strong>Open blocks</strong> are assignment slots that can be filled during weekly setup</li>
            <li>• <strong>Scheduled assignments</strong> appear in their assigned time blocks</li>
            <li>• Use the Weekly Setup page to assign specific assignments to open blocks</li>
          </ul>
        </div>
      </main>
    </div>
  );
}