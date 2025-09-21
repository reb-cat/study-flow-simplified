import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { convertTo12Hour } from '@/lib/utils';
import { getSubjectColorClass } from '@/lib/subject-colors';

interface ScheduleBlockDisplayProps {
  block: SupabaseScheduleBlock;
  assignedFamily?: string;
  children?: React.ReactNode;
}

// Display exactly what comes from the database
export function ScheduleBlockDisplay({ block, assignedFamily, children }: ScheduleBlockDisplayProps) {
  const colorClass = getSubjectColorClass(block.subject || assignedFamily);
  
  return (
    <div className="space-y-3">
      <div className={`text-sm font-medium rounded-lg p-3 transition-all duration-200 ${colorClass || 'bg-card border border-border/50'}`}>
        <span className="text-foreground/90">
          {convertTo12Hour(block.start_time)}
        </span>
        <span className="ml-3 text-foreground font-semibold">
          {block.subject || block.block_name}
        </span>
      </div>
      
      {block.block_type === 'Assignment' && !children && (
        <div className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg border border-dashed border-border">
          Assignment block - ready for content
        </div>
      )}
      
      <div className="pl-2">
        {children}
      </div>
    </div>
  );
}