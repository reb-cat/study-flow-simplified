import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewScheduleBlock } from '@/components/OverviewScheduleBlock';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { PopulatedScheduleBlock } from '@/types/schedule';

interface OverviewDayCardProps {
  day: Date;
  selectedProfile: any;
  assignments: UnifiedAssignment[];
  scheduleBlocks: SupabaseScheduleBlock[];
  populatedBlocks: PopulatedScheduleBlock[];
  formatDate: (date: Date) => string;
}

export function OverviewDayCard({ 
  day, 
  selectedProfile, 
  assignments,
  scheduleBlocks,
  populatedBlocks,
  formatDate
}: OverviewDayCardProps) {
  const dateStr = day.toISOString().split('T')[0];
  const dayAssignments = assignments.filter(a => a.scheduled_date === dateStr);

  return (
    <Card className="card-elevated h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {formatDate(day)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {scheduleBlocks.map((block) => {
          const populatedBlock = populatedBlocks.find(p => p.id === block.id);
          const manualAssignment = dayAssignments.find(a => 
            a.scheduled_block === block.block_number && !populatedBlock?.assignment
          );
          
          const assignment = populatedBlock?.assignment || manualAssignment;
          
          return (
            <OverviewScheduleBlock 
              key={block.id} 
              block={block}
              assignment={assignment}
            />
          );
        })}

        {scheduleBlocks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No schedule blocks found
          </p>
        )}
      </CardContent>
    </Card>
  );
}