import React, { useState } from 'react';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import { convertTo12Hour } from '@/lib/utils';
import { getScheduleBlockClassName } from '@/lib/schedule-colors';
import { Button } from '@/components/ui/button';

interface OverviewScheduleBlockProps {
  block: SupabaseScheduleBlock;
  assignment?: UnifiedAssignment;
  status?: string;
  onMarkComplete?: (assignmentId: string, blockId: string) => void;
}

export function OverviewScheduleBlock({ block, assignment, status, onMarkComplete }: OverviewScheduleBlockProps) {
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
  const handleMarkComplete = () => {
    if (assignment && onMarkComplete) {
      onMarkComplete(assignment.id, block.id);
    }
  };

  // Status comes from Guided Day actions, stored in database
  const getStatusIcon = () => {
    if (status === 'complete') return '✅';
    if (status === 'overtime') return '➡️';
    if (status === 'stuck') return '⚠️';

    // Fall back to assignment checks for compatibility
    if (assignment?.completed_at) return '✅';

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
        <div className="flex-1 min-w-0 pr-3">
          <div className="text-xs font-medium text-foreground/70 mb-1">
            {convertTo12Hour(block.start_time)}
            {block.block_type !== 'Assignment' ? ` • ${block.subject || block.block_name}` : ''}
          </div>
          <div className={`text-sm font-medium break-words hyphens-auto leading-tight ${getTitleClassName()}`}>
            {getAssignmentTitle()}
          </div>
        </div>
        <div className={`text-2xl font-mono ${
          status === 'complete' ? 'text-green-600' :
          status === 'stuck' ? 'text-stuck' :
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