import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { convertTo12Hour } from '@/lib/utils';

interface ScheduleBlockDisplayProps {
  block: SupabaseScheduleBlock;
  assignedFamily?: string;
  children?: React.ReactNode;
}

// Display exactly what comes from the database
export function ScheduleBlockDisplay({ block, assignedFamily, children }: ScheduleBlockDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded flex items-center justify-between">
        <div>
          <span>Block {block.block_number}: {convertTo12Hour(block.start_time)}–{convertTo12Hour(block.end_time)}</span>
          <span className="ml-2">• {block.subject || block.block_name}</span>
        </div>
        {assignedFamily && block.block_type === 'Assignment' && (
          <Badge variant="outline" className="text-xs">
            {assignedFamily}
          </Badge>
        )}
      </div>
      
      {block.block_type === 'Assignment' && !children && (
        <div className="text-sm text-muted-foreground italic p-2 bg-muted/50 rounded">
          Assignment block - needs population
        </div>
      )}
      
      {children}
    </div>
  );
}