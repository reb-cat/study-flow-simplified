import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewAssignmentCard } from './OverviewAssignmentCard';
import { useAssignmentPlacement } from '@/hooks/useAssignmentPlacement';
import { UnifiedAssignment } from '@/types/assignment';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';

interface SimpleDayOverviewProps {
  day: Date;
  selectedProfile: any;
  assignments: UnifiedAssignment[];
  scheduleBlocks: SupabaseScheduleBlock[];
  formatDate: (date: Date) => string;
  formatTime: (minutes: number) => string;
  getDayName: (date: Date) => string;
}

export const SimpleDayOverview: React.FC<SimpleDayOverviewProps> = ({
  day,
  selectedProfile,
  assignments,
  scheduleBlocks,
  formatDate,
  formatTime,
  getDayName
}) => {
  const { populatedBlocks } = useAssignmentPlacement(
    assignments,
    scheduleBlocks,
    selectedProfile?.displayName || '',
    day.toISOString().split('T')[0]
  );

  // Check if it's today
  const isToday = day.toDateString() === new Date().toDateString();
  
  return (
    <Card className={`h-full ${isToday ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {formatDate(day)}
          {isToday && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              Today
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {populatedBlocks.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No schedule blocks
          </div>
        ) : (
          populatedBlocks.map((block, blockIndex) => (
            <OverviewAssignmentCard
              key={blockIndex}
              block={block}
              assignment={block.assignment}
              formatTime={formatTime}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};