/**
 * Date-only handling: avoid timezone shifts by using YYYY-MM-DD as "UTC midnight".
 * Use these helpers for all session date storage and API query/response.
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(s: string): boolean {
  return DATE_ONLY_REGEX.test(s);
}

/**
 * Parse YYYY-MM-DD to Date at UTC midnight.
 * Use for: storing session date, query ranges (gte/lte), comparisons.
 */
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Format a Date from DB to YYYY-MM-DD (UTC).
 * Use for: API responses so client gets consistent date string.
 */
export function formatDateToUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
