import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// UUID to student name mapping
export const studentIdToName: Record<string, string> = {
  'ab0d7c00-fa89-4d56-994a-7038f8d2ff6b': 'Khalil',
  'ba62b80b-39ef-476d-8e5e-13134e36dfde': 'Abigail'
};

// Helper function to get student name from UUID
export const getStudentNameFromId = (uuid: string): string => {
  return studentIdToName[uuid] || 'Unknown Student';
};
