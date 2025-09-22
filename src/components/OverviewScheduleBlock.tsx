import React from 'react';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { convertTo12Hour } from '@/lib/utils';
import { getScheduleBlockClassName } from '@/lib/schedule-colors';

interface OverviewScheduleBlockProps {
  block: SupabaseScheduleBlock;
  assignment?: UnifiedAssignment;
  status?: string;
}

export function OverviewScheduleBlock({ block, assignment, status }: OverviewScheduleBlockProps) {
  const blockClassName = getScheduleBlockClassName(block);
  
  // Status comes from Guided Day actions, stored in database
  const getStatusIcon = () => {
    if (status === 'complete') return '✓';
    if (status === 'overtime') return '→';
    if (status === 'stuck') return '⚠';

    // Fall back to assignment checks for compatibility
    if (assignment?.completed_at) return '✓';

    return '○';  // Empty circle - not started
  };

  const getAssignmentTitle = () => {
    if (assignment) {
      return assignment.title;
    }
    if ((block as any).fallback) {
      return (block as any).fallback;
    }
    if (block.block_type === 'Assignment' || block.block_type === 'Study Hall') {
      return 'No assignment scheduled';
    }
    return block.subject || block.block_name;
  };

  const getTitleClassName = () => {
    if ((block as any).fallback) {
      return 'text-muted-foreground italic';
    }
    if (!assignment && (block.block_type === 'Assignment' || 
        (block.subject === 'Study Hall' || block.block_name === 'Study Hall'))) {
      return 'text-muted-foreground/60 italic';
    }
    return 'text-foreground';
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${blockClassName}`}>
      <div className="flex-1">
        <div className="text-xs font-medium text-foreground/70 mb-1">
          {convertTo12Hour(block.start_time)}
        </div>
        <div className={`text-sm font-medium ${getTitleClassName()}`}>
          {getAssignmentTitle()}
        </div>
      </div>
      <div className="text-lg font-mono text-foreground/80">
        {getStatusIcon()}
      </div>
    </div>
  );
}