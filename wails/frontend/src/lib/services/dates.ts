/** Returns today's date as a YYYY-MM-DD string in the local timezone. */
export function localDateISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format a date string for display, handling YYYY-MM-DD strings as local dates
 * to avoid timezone shift (where UTC midnight becomes the previous day in western timezones).
 */
export function formatLocalDate(dateStr: string): string {
  const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString();
  }
  return new Date(dateStr).toLocaleDateString();
}
