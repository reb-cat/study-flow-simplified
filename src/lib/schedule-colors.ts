import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';

export function getScheduleBlockClassName(block: SupabaseScheduleBlock): string {
  const blockType = block.block_type;
  const subject = block.subject || block.block_name || '';
  
  // Bible blocks → green background
  if (blockType === 'Bible') return 'schedule-block schedule-block-home';
  
  // Assignment blocks → green background  
  if (blockType === 'Assignment') return 'schedule-block schedule-block-home';
  
  // Special subjects → orange background (check first for Co-op blocks)
  if (subject.includes('Forensics') || 
      subject.includes('Tutoring') || 
      subject.includes('Algebra') || 
      subject.includes('LF') ||
      subject.includes('Language Fundamentals')) {
    return 'schedule-block schedule-block-special';
  }
  
  // Co-op blocks → purple background (unless special subject above)
  if (blockType === 'Co-op') return 'schedule-block schedule-block-location';
  
  // Lunch → purple background
  if (blockType === 'Lunch') return 'schedule-block schedule-block-location';
  
  // Travel → blue background
  if (blockType === 'Travel') return 'schedule-block schedule-block-travel';
  
  // Movement → yellow background
  if (blockType === 'Movement') return 'schedule-block schedule-block-movement';
  
  // Default - no special styling
  return '';
}