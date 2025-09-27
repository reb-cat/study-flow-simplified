import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { convertTo12Hour } from '@/lib/utils';
import { getScheduleBlockClassName } from '@/lib/schedule-colors';

interface ScheduleBlockDisplayProps {
  block: SupabaseScheduleBlock;
  assignedFamily?: string;
  children?: React.ReactNode;
}

// Display exactly what comes from the database
export function ScheduleBlockDisplay({ block, assignedFamily, children }: ScheduleBlockDisplayProps) {
  const blockClassName = getScheduleBlockClassName(block);
  
  return (
    <div className={`space-y-2 p-3 ${blockClassName}`}>
      <div className="text-xs font-medium text-foreground/80">
        <span>
          {convertTo12Hour(block.start_time)}
          {block.block_type !== 'Assignment' ? ` • ${block.subject || block.block_name}` : ''}
        </span>
      </div>
      
      
      {children}
    </div>
  );
}