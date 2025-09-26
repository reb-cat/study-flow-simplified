import React, { useState } from 'react';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { convertTo12Hour } from '@/lib/utils';
import { getScheduleBlockClassName } from '@/lib/schedule-colors';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OverviewScheduleBlockProps {
  block: SupabaseScheduleBlock;
  assignment?: UnifiedAssignment;
  status?: string;
}

export function OverviewScheduleBlock({ block, assignment, status }: OverviewScheduleBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const blockClassName = getScheduleBlockClassName(block);
  const isCompleted = status === 'complete' || status === 'overtime';

  // Check if it's after school time (3 PM or later)
  const isAfterSchool = new Date().getHours() >= 15;

  // Determine if block should be actionable
  const isAfterSchoolItem = status === 'overtime' || (assignment?.scheduled_block === 999);
  const isRegularIncomplete = !status || status === '';
  const shouldBeActionable = isAfterSchoolItem || (isRegularIncomplete && isAfterSchool);

  // Handle marking assignment complete
  const handleMarkComplete = async () => {
    if (!assignment) return;

    try {
      // Update assignment as completed
      await supabase.from('demo_assignments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assignment.id);

      // Add status to daily_schedule_status if not already there
      await supabase.from('daily_schedule_status')
        .upsert({
          template_block_id: block.id,
          date: new Date().toISOString().split('T')[0],
          student_name: `demo-${block.student_name.toLowerCase()}`,
          status: 'complete'
        });

      toast({
        title: "Assignment completed! ✅",
        description: `Great work on ${assignment.title}`
      });

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error marking assignment complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark assignment complete",
        variant: "destructive"
      });
    }
  };

  // Status comes from Guided Day actions, stored in database
  const getStatusIcon = () => {
    if (status === 'complete') return '✅';
    if (status === 'overtime') return '➡️';
    if (status === 'stuck') return '⚠️';

    // Fall back to assignment checks for compatibility - only show checkmark if completed TODAY
    if (assignment?.completed_at) {
      const completedDate = new Date(assignment.completed_at).toDateString();
      const today = new Date().toDateString();
      if (completedDate === today) return '✅';
    }

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

  // Determine background and icon colors based on status
  const getBlockStyle = () => {
    if (status === 'complete' || status === 'overtime' || status === 'stuck') {
      return 'bg-gray-100'; // Grey background for any completed/processed block
    }
    return blockClassName; // Original color for pending blocks
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${
          isCompleted ? 'bg-gray-100 cursor-pointer hover:bg-gray-200' :
          shouldBeActionable && assignment ? 'cursor-pointer hover:bg-gray-50' : ''
        } ${getBlockStyle()}`}
        onClick={() => (isCompleted || shouldBeActionable) && setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="text-xs font-medium text-foreground/70 mb-1">
            {convertTo12Hour(block.start_time)}
          </div>
          <div className={`text-sm font-medium ${getTitleClassName()}`}>
            {getAssignmentTitle()}
          </div>
        </div>
        <div className={`text-2xl font-mono ${
          status === 'complete' ? 'text-green-600' :
          status === 'stuck' ? 'text-red-600' :
          status === 'overtime' ? 'text-orange-600' :
          'text-foreground/80'
        }`}>
          {getStatusIcon()}
        </div>
      </div>

      {expanded && assignment && (isCompleted || shouldBeActionable) && (
        <div className="mt-1 p-3 bg-blue-50 rounded space-y-3">
          {/* Show assignment instructions if available */}
          {(assignment as any).instructions && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Instructions:</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {(assignment as any).instructions}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {assignment.canvas_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={assignment.canvas_url} target="_blank" rel="noopener noreferrer">
                  Open in Canvas
                </a>
              </Button>
            )}

            {/* Mark Complete button - only for actionable items */}
            {shouldBeActionable && !isCompleted && (
              <Button size="sm" onClick={handleMarkComplete} className="bg-green-600 hover:bg-green-700">
                Mark Complete
              </Button>
            )}
          </div>

          {/* Show completion status for completed items */}
          {isCompleted && (
            <p className="text-sm text-green-600 font-medium">
              ✅ This assignment has been completed
            </p>
          )}

          {/* Show time restriction message for incomplete blocks during school hours */}
          {isRegularIncomplete && !isAfterSchool && (
            <p className="text-sm text-amber-600">
              ⏰ Available for completion after 3:00 PM
            </p>
          )}
        </div>
      )}
    </div>
  );
}