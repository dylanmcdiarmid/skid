/**
 * @file time.ts
 * @description Provides a type-safe way to handle time units using Branded Types.
 * This prevents accidental mixing of different time units (e.g., passing milliseconds
 * to a function that expects seconds).
 *
 * @pattern Branded Types (also known as Opaque Types)
 * @updated Monday, September 8, 2025
 */

import { TIME } from "@lib/constants";

// ---[ Core Brand Definition ]-------------------------------------------------

/**
 * A generic helper type to create a branded type.
 * It intersects a base type `K` with a unique "brand" signature `T`.
 * This makes the new type incompatible with the base type and other branded types.
 * There is no runtime cost, as this is a compile-time-only construct.
 *
 * @template K The base type (e.g., number, string).
 * @template T A unique string literal to act as the brand identifier.
 */
type Brand<K, T> = K & { readonly __brand: T };

// ---[ Branded Time Types ]----------------------------------------------------

export type Millisecond = Brand<number, "Millisecond">;
export type Second = Brand<number, "Second">;
export type Minute = Brand<number, "Minute">;
export type Hour = Brand<number, "Hour">;
export type Day = Brand<number, "Day">;

// ---[ Constructor Functions ]-------------------------------------------------
// These functions safely "cast" a raw number to its corresponding branded type.

export function fromMilliseconds(ms: number): Millisecond {
  return ms as Millisecond;
}

export function fromSeconds(s: number): Second {
  return s as Second;
}

export function fromMinutes(m: number): Minute {
  return m as Minute;
}

export function fromHours(h: number): Hour {
  return h as Hour;
}

export function fromDays(d: number): Day {
  return d as Day;
}

// ---[ Conversion Functions ]--------------------------------------------------
// These functions handle the conversion between different branded time units,
// ensuring that operations are explicit and type-safe.

// To Milliseconds
export function secondsToMs(s: Second): Millisecond {
  return (s * TIME.SECONDS_TO_MS) as Millisecond;
}

export function minutesToMs(m: Minute): Millisecond {
  return (m * TIME.MINUTES_TO_MS) as Millisecond;
}

export function hoursToMs(h: Hour): Millisecond {
  return (h * TIME.HOURS_TO_MS) as Millisecond;
}

// To Seconds
export function msToSeconds(ms: Millisecond): Second {
  return (ms / TIME.MS_TO_SECONDS) as Second;
}

export function minutesToSeconds(m: Minute): Second {
  return (m * 60) as Second;
}

export function hoursToSeconds(h: Hour): Second {
  return (h * 60 * 60) as Second;
}

// To Minutes
export function secondsToMinutes(s: Second): Minute {
  return (s / 60) as Minute;
}

export function hoursToMinutes(h: Hour): Minute {
  return (h * 60) as Minute;
}

export function nowMs(): Millisecond {
  return Date.now() as Millisecond;
}

export function dateToMs(date: Date): Millisecond {
  return date.getTime() as Millisecond;
}
