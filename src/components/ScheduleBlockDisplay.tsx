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
  const colorClass = getSubjectColorClass(block.subject || assignedFamily, block.block_name);
  
  const shortenSubjectName = (name: string) => {
    const shortNames: Record<string, string> = {
      'American Literature': 'American Lit',
      'British Literature': 'British Lit',
      'World Literature': 'World Lit',
      'Mathematics': 'Math',
      'Physical Education': 'PE',
      'Social Studies': 'Social St',
      'Language Arts': 'Lang Arts',
    };
    return shortNames[name] || name;
  };
  
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-3 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 ${colorClass || 'bg-card border border-border/50'}`}>
        <span className="text-foreground/90 whitespace-nowrap text-xs">
          {convertTo12Hour(block.start_time)}
        </span>
        <span className="text-foreground font-semibold flex-1 min-w-0">
          {shortenSubjectName(block.subject || block.block_name)}
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