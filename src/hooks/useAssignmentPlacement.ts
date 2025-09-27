import { useMemo } from 'react';
import { PopulatedScheduleBlock } from '@/types/schedule';
import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';
import { UnifiedAssignment } from '@/types/assignment';
import {
  detectFamily,
  getBlockFamily,
  isStudyHallBlock,
  shouldPrioritizeAlgebra,
  STUDY_HALL_FALLBACK,
} from '@/lib/family-detection';

interface AssignmentWithFamily extends UnifiedAssignment {
  detectedFamily: string;
}

/**
 * Hook to populate Assignment and Study Hall blocks with actual assignments
 * using Charlotte Mason family patterns.
 *
 * IMPORTANT: This hook always calls exactly one `useMemo`.
 * Never conditionally call hooks or return before the hook — that breaks hook order.
 */
export function useAssignmentPlacement(
  assignments: UnifiedAssignment[] | undefined,
  scheduleBlocks: SupabaseScheduleBlock[] | undefined,
  studentName: string,
  selectedDate: string
): {
  populatedBlocks: PopulatedScheduleBlock[];
  assignmentsWithFamily: AssignmentWithFamily[];
  unscheduledCount: number;
} {
  return useMemo(() => {
    const aList: UnifiedAssignment[] = Array.isArray(assignments) ? assignments : [];
    const bList: SupabaseScheduleBlock[] = Array.isArray(scheduleBlocks) ? scheduleBlocks : [];

    // If data not ready, return an inert structure (prevents placeholder scheduling on empty data)
    if (aList.length === 0 || bList.length === 0) {
      return {
        populatedBlocks: [],
        assignmentsWithFamily: [],
        unscheduledCount: 0,
      };
    }

    // --- Normalize & classify assignments ---
    const withFamily: AssignmentWithFamily[] = aList.map((a) => ({
      ...a,
      detectedFamily: detectFamily(a),
    }));

    // Active = not completed
    const active = withFamily.filter((a) => a.completion_status !== 'completed');

    // Eligible today = not already scheduled for this same day/block
    const unscheduled = active
      .filter((a) => !(a.scheduled_block && a.scheduled_date === selectedDate))
      .sort((a, b) => {
        const now = Date.now();
        const at = a.due_date ? +new Date(a.due_date) : Infinity;
        const bt = b.due_date ? +new Date(b.due_date) : Infinity;
        const aOver = at < now;
        const bOver = bt < now;
        if (aOver && !bOver) return -1;
        if (bOver && !aOver) return 1;
        return at - bt;
      });

    // --- Build the day ---
    const dayName = getDayName(selectedDate);

    // Only blocks that can accept work
    const assignable = bList.filter((blk) => {
      const isSH = isStudyHallBlock(blk.block_type, blk.start_time, blk.subject, blk.block_name || undefined);
      return (blk.block_type || '') === 'Assignment' || isSH;
    });

    const scheduledIds = new Set<string>();
    const populated: PopulatedScheduleBlock[] = [];

    for (const blk of assignable) {
      const family = getBlockFamily(studentName, dayName, blk.block_number ?? 0);

      if (!family) {
        populated.push({ ...blk, assignment: undefined, assignedFamily: undefined });
        continue;
      }

      // Khalil algebra priority
      if (shouldPrioritizeAlgebra(studentName, dayName, blk.block_number ?? 0)) {
        const algebra = unscheduled.find(
          (u) =>
            !scheduledIds.has(u.id) &&
            ((u.subject || '').toLowerCase().includes('algebra') || (u.course_name || '').toLowerCase().includes('algebra'))
        );
        if (algebra) {
          scheduledIds.add(algebra.id);
          populated.push({ ...blk, assignment: algebra, assignedFamily: family });
          continue;
        }
      }

      const isSH = isStudyHallBlock(blk.block_type, blk.start_time, blk.subject, blk.block_name || undefined);

      if (isSH) {
        // Prefer a short task from the same family
        const short = unscheduled.find(
          (u) => !scheduledIds.has(u.id) && u.detectedFamily === family && isShortTask(u)
        );
        if (short) {
          scheduledIds.add(short.id);
          populated.push({ ...blk, assignment: short, assignedFamily: family });
          continue;
        }

        // If any pending exists, do NOT show a fallback; place anything reasonable
        const anyPending = active.some(
          (a) => a.completion_status === 'pending' && !(a.scheduled_block && a.scheduled_date === selectedDate)
        );
        if (anyPending) {
          const any = unscheduled.find((u) => !scheduledIds.has(u.id));
          if (any) {
            scheduledIds.add(any.id);
            populated.push({ ...blk, assignment: any, assignedFamily: family });
            continue;
          }
          populated.push({ ...blk, assignment: undefined, assignedFamily: family });
          continue;
        }

        // No pending work at all → allowed to show Study Hall fallback (currently blank string)
        populated.push({ ...blk, assignment: undefined, assignedFamily: family, fallback: STUDY_HALL_FALLBACK });
        continue;
      }

      // Regular Assignment block: same-family first
      const inFamily = unscheduled
        .filter((u) => !scheduledIds.has(u.id) && u.detectedFamily === family)
        .sort((a, b) => {
          const at = a.due_date ? +new Date(a.due_date) : Infinity;
          const bt = b.due_date ? +new Date(b.due_date) : Infinity;
          return at - bt;
        });

      let picked = inFamily[0];

      // If none, pick from the least-used family so far today to enforce rotation
      if (!picked) {
        const usedCount: Record<string, number> = {};
        for (const p of populated) {
          const af = (p.assignment as AssignmentWithFamily | undefined)?.detectedFamily;
          if (af) usedCount[af] = (usedCount[af] || 0) + 1;
        }
        picked = unscheduled
          .filter((u) => !scheduledIds.has(u.id))
          .sort((a, b) => {
            const ac = usedCount[a.detectedFamily] || 0;
            const bc = usedCount[b.detectedFamily] || 0;
            if (ac !== bc) return ac - bc; // prefer families we used less today
            const at = a.due_date ? +new Date(a.due_date) : Infinity;
            const bt = b.due_date ? +new Date(b.due_date) : Infinity;
            return at - bt;
          })[0];
      }

      populated.push({ ...blk, assignment: picked, assignedFamily: family });
      if (picked) scheduledIds.add(picked.id);
    }

    // Add all remaining (non-assignable) blocks as-is
    for (const blk of bList) {
      if (!populated.find((p) => p.id === blk.id)) {
        populated.push({ ...blk, assignment: undefined, assignedFamily: undefined });
      }
    }

    // Chronological order
    populated.sort((a, b) => {
      const [ah, am] = a.start_time.split(':').map(Number);
      const [bh, bm] = b.start_time.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });

    return {
      populatedBlocks: populated,
      assignmentsWithFamily: active,
      unscheduledCount: Math.max(0, unscheduled.length - scheduledIds.size),
    };
  }, [
    studentName,
    selectedDate,
    JSON.stringify(
      (assignments || []).map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        course_name: a.course_name,
        due_date: a.due_date,
        scheduled_date: a.scheduled_date,
        scheduled_block: a.scheduled_block,
        completion_status: a.completion_status,
      }))
    ),
    JSON.stringify(
      (scheduleBlocks || []).map((b) => ({
        id: b.id,
        block_type: b.block_type,
        block_number: b.block_number,
        start_time: b.start_time,
        subject: b.subject,
        block_name: (b as any).block_name,
      }))
    ),
  ]);
}

function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00'); // avoid TZ issues
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
}

function isShortTask(assignment: AssignmentWithFamily): boolean {
  const title = (assignment.title || '').toLowerCase();
  const shortTaskKeywords = [
    'check',
    'review',
    'practice',
    'worksheet',
    'exercise',
    'question',
    'problem',
    'drill',
    'vocab',
    'vocabulary',
  ];
  return shortTaskKeywords.some((kw) => title.includes(kw));
}