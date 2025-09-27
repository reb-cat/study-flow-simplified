import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewScheduleBlock } from '@/components/OverviewScheduleBlock';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';

interface OverviewDayCardProps {
  day: Date;
  selectedProfile: any;
  assignments: UnifiedAssignment[];
  scheduleBlocks: SupabaseScheduleBlock[];
  populatedBlocks: PopulatedScheduleBlock[];
  formatDate: (date: Date) => string;
  onDayClick?: (dateStr: string) => void;
}

export function OverviewDayCard({
  day,
  selectedProfile,
  assignments,
  scheduleBlocks,
  populatedBlocks,
  formatDate,
  onDayClick
}: OverviewDayCardProps) {
  const { getGuidedDaySchedule } = useApp();
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const dayNum = String(day.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${dayNum}`;
  const canonicalBlocks = getGuidedDaySchedule?.(selectedProfile?.id, dateStr) || null;
  const dayAssignments = assignments.filter(a => a.scheduled_date === dateStr);
  const [blockStatuses, setBlockStatuses] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function fetchStatuses() {
      const studentId = selectedProfile?.id || '';
      
      const { data: fetchedStatuses } = await supabase
        .from('daily_schedule_status')
        .select('*')
        .eq('student_name', studentId)
        .eq('date', dateStr);

      setBlockStatuses(fetchedStatuses || []);
    }

    if (selectedProfile?.id) {
      fetchStatuses();
    }
  }, [dateStr, selectedProfile?.id]);

  return (
    <Card className="card-elevated h-fit">
      <CardHeader className="pb-3">
        <div
          className="cursor-pointer hover:bg-muted/50 -m-2 p-2 rounded"
          onClick={() => {
            onDayClick?.(dateStr);
          }}
        >
          <CardTitle className="text-lg font-semibold">
            {formatDate(day)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {scheduleBlocks.map((block) => {
          const populatedBlock = (canonicalBlocks || populatedBlocks).find(p => p.id === block.id);
          const manualAssignment = dayAssignments.find(a =>
            a.scheduled_block === block.block_number && !populatedBlock?.assignment
          );

          const assignment = populatedBlock?.assignment || manualAssignment;
          const blockWithFallback = populatedBlock || block;

          // ADD THIS LINE
          const blockStatus = blockStatuses.find(s => s.template_block_id === block.id);

          return (
            <OverviewScheduleBlock
              key={block.id}
              block={blockWithFallback}
              assignment={assignment}
              status={blockStatus?.status}
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