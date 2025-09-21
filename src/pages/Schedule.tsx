import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleView } from '@/components/ScheduleView';
import { ParentWeeklySetup } from '@/components/ParentWeeklySetup';
import { type Student } from '@/lib/scheduling-constants';

export default function Schedule() {
  const [selectedStudent, setSelectedStudent] = useState<Student>("Abigail");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Family Schedule</h1>
        
        <Tabs value={selectedStudent} onValueChange={(value) => setSelectedStudent(value as Student)}>
          <TabsList>
            <TabsTrigger value="Abigail">Abigail</TabsTrigger>
            <TabsTrigger value="Khalil">Khalil</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Daily Schedule</TabsTrigger>
          <TabsTrigger value="setup">Weekly Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          <ScheduleView student={selectedStudent} />
        </TabsContent>
        
        <TabsContent value="setup">
          <ParentWeeklySetup student={selectedStudent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}