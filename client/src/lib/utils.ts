import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { indexGlobals } from './globals';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

// This should match pagination.go
export interface Pagination<T> {
  items: T[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface PagArgs {
  page: number;
  pageSize: number;
}

export function pagArgsToQueryString(pagArgs: PagArgs): string {
  return new URLSearchParams({
    page: pagArgs.page.toString(),
    pageSize: pagArgs.pageSize.toString(),
  }).toString();
}

export function isDev() {
  return indexGlobals()?.isDev ?? false;
}

export function parseDurationToMinutes(input: string): number {
  if (!input) return 0;
  
  // If it's just a number, assume minutes
  if (/^\d+$/.test(input.trim())) {
    return parseInt(input.trim(), 10);
  }

  const normalized = input.toLowerCase();
  let totalMinutes = 0;

  // Extract hours
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }

  // Extract minutes
  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);
  if (minuteMatch) {
    totalMinutes += parseFloat(minuteMatch[1]);
  }

  // If no units found but contains number, treat as minutes (fallback for "30" mixed with garbage)
  if (!hourMatch && !minuteMatch) {
      const numberMatch = normalized.match(/(\d+)/);
      if (numberMatch) {
          return parseInt(numberMatch[1], 10);
      }
  }

  return Math.round(totalMinutes);
}
