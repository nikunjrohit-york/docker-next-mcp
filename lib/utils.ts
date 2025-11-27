import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with tailwind-merge and clsx.
 * This ensures that Tailwind classes are properly deduplicated and conditional classes are handled.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
