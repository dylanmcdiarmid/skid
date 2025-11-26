/**
 * Centralized constants for the application
 *
 * This file consolidates constants that were previously scattered throughout
 * the codebase to provide a single source of truth and eliminate duplication.
 */

// =============================================================================
// TIME CONSTANTS
// =============================================================================

export const TIME = Object.freeze({
  ONE_SECOND: 1000,
  HALF_SECOND: 500,
  FIVE_SECONDS: 5000,
  TEN_SECONDS: 10_000,
  TWENTY_SECONDS: 20_000,
  ONE_MINUTE: 60_000,

  // Conversion factors
  SECONDS_TO_MS: 1000,
  MINUTES_TO_MS: 60_000,
  HOURS_TO_MS: 3_600_000,
  MS_TO_SECONDS: 1000,
} as const);
