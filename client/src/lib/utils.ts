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
