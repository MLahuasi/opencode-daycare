/**
 * Returns the current system date as an ISO date-only value.
 *
 * @returns The current local date in `YYYY-MM-DD` format.
 */
export function getTodayIsoDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}
