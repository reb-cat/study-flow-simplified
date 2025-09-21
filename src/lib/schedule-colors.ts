import { SupabaseScheduleBlock } from '@/hooks/useSupabaseSchedule';

export function getBlockColor(block: SupabaseScheduleBlock): string {
  const blockType = block.block_type;
  const subject = block.subject || block.block_name || '';
  
  // Blue category - Prep/Load
  if (blockType === 'Prep/Load' || blockType === 'Prep') return 'prep';
  
  // Purple category - Location-based (Co-op, Lunch)
  if (blockType === 'Lunch') return 'location';
  if (blockType === 'Co-op' && !isSpecialClass(subject)) return 'location';
  
  // Orange category - Special classes (check subject for Co-op blocks)
  if (subject.includes('Forensics') || 
      subject.includes('Tutoring') || 
      subject.includes('Algebra') || 
      subject.includes('LF') ||
      subject.includes('Language Fundamentals')) {
    return 'special';
  }
  
  // Green category - Home work (Assignment, Bible)
  if (blockType === 'Bible' || blockType === 'Assignment') return 'home';
  
  // Travel gets its own shade of blue
  if (blockType === 'Travel') return 'travel';
  
  // Movement gets yellow
  if (blockType === 'Movement') return 'movement';
  
  // Default
  return 'home';
}

function isSpecialClass(subject: string): boolean {
  return subject.includes('Forensics') || 
         subject.includes('Tutoring') || 
         subject.includes('Algebra') || 
         subject.includes('LF') ||
         subject.includes('Language Fundamentals');
}

export function getScheduleBlockClassName(block: SupabaseScheduleBlock): string {
  const colorCategory = getBlockColor(block);
  return `schedule-block schedule-block-${colorCategory}`;
}