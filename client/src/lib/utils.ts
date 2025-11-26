import { fromJson, toJson } from "@bufbuild/protobuf";
import { type Timestamp, TimestampSchema } from "@bufbuild/protobuf/wkt";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { indexGlobals } from "./globals";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

/**
 * Converts a gRPC Timestamp to an RFC 3339 string
 */
export function grpcTsToString(timestamp: Timestamp): string {
  return toJson(TimestampSchema, timestamp) as string;
}

/**
 * Converts a gRPC Timestamp to a JavaScript Date object
 */
export function grpcTsToDate(timestamp: Timestamp): Date {
  const milliseconds =
    Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000;
  return new Date(milliseconds);
}

/**
 * Converts an RFC 3339 string to a gRPC Timestamp
 */
export function stringToGrpcTs(rfc3339String: string): Timestamp {
  return fromJson(TimestampSchema, rfc3339String);
}

/**
 * Converts a gRPC Timestamp to a JavaScript Date object
 */
export function grpcTsToDateFallback(timestamp?: Timestamp): Date {
  if (!timestamp) {
    return new Date(0);
  }
  const milliseconds =
    Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000;
  return new Date(milliseconds);
}

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
