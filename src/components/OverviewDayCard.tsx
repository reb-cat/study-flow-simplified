import React, { useState, useEffect } from 'react';
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
  const [blockStatuses, setBlockStatuses] = useState<any[]>([]);

  // Fetch statuses when component loads
  useEffect(() => {
    const fetchStatuses = async () => {
      if (selectedProfile?.displayName) {
        const { data } = await supabase
          .from('daily_schedule_status')
          .select('*')
          .eq('student_name', `demo-${selectedProfile.displayName.toLowerCase()}`)
          .eq('date', dateStr);
        
        setBlockStatuses(data || []);
      }
    };

    fetchStatuses();
  }, [selectedProfile?.displayName, dateStr]);

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
          
          // Pass through fallback for blocks that should have one
          const blockWithFallback = populatedBlock || block;
          
          // Check for status
          const status = blockStatuses?.find(s => s.template_block_id === block.id)?.status;
          
          return (
            <div key={block.id} className="flex items-center gap-2">
              <OverviewScheduleBlock 
                block={blockWithFallback}
                assignment={assignment}
              />
              <div className="flex-shrink-0">
                {status === 'complete' && <span className="text-green-600">✓</span>}
                {status === 'overtime' && <span className="text-orange-600">→</span>}
                {status === 'stuck' && <span className="text-red-600">⚠</span>}
              </div>
            </div>
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