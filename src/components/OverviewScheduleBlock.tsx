import React from 'react';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { convertTo12Hour } from '@/lib/utils';
import { getScheduleBlockClassName } from '@/lib/schedule-colors';

interface OverviewScheduleBlockProps {
  block: SupabaseScheduleBlock;
  assignment?: UnifiedAssignment;
}

export function OverviewScheduleBlock({ block, assignment }: OverviewScheduleBlockProps) {
  const blockClassName = getScheduleBlockClassName(block);
  
  // Status comes from Guided Day actions, stored in database
  const getStatusIcon = (assignment?: UnifiedAssignment) => {
    if (!assignment) return '○';  // Empty circle - no assignment
    
    // These fields are set by Guided Day mode
    if (assignment.completed_at) return '✓';  // Checkmark
    if ((assignment as any).is_stuck) return '⚠';      // Warning triangle  
    if ((assignment as any).needs_more_time) return '→'; // Arrow
    
    return '○';  // Empty circle - not started
  };

  const getAssignmentTitle = () => {
    if (assignment) {
      return assignment.title;
    }
    if (block.block_type === 'Assignment') {
      return 'No assignment scheduled';
    }
    return block.subject || block.block_name;
  };

  const getTitleClassName = () => {
    if (!assignment && block.block_type === 'Assignment') {
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
        {getStatusIcon(assignment)}
      </div>
    </div>
  );
}