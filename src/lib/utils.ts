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

export function getStudentNameFromEmail(email: string): string {
  switch (email.toLowerCase()) {
    case 'khalilsjh10@gmail.com':
      return 'khalil-user';
    case 'sweetpeaag120@gmail.com':
      return 'abigail-user';
    default:
      return email.split('@')[0];
  }
}
