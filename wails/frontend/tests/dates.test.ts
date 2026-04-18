import { describe, it, expect } from 'vitest';
import { formatLocalDate } from '../src/lib/services/dates';

describe('formatLocalDate', () => {
  it('should display the same date that was set, not shifted by timezone', () => {
    // A YYYY-MM-DD string like "2026-05-15" should display as May 15, 2026
    // regardless of the user's timezone. The bug was that new Date("2026-05-15")
    // parses as UTC midnight, and toLocaleDateString() shifts it back a day
    // in timezones west of UTC.
    const result = formatLocalDate('2026-05-15');
    const date = new Date(2026, 4, 15); // May 15, 2026 in local time
    expect(result).toBe(date.toLocaleDateString());
  });

  it('should handle a full datetime string without shifting', () => {
    // completed_at uses full ISO datetime strings like "2026-03-20T15:30:00Z"
    const result = formatLocalDate('2026-03-20T15:30:00Z');
    const expected = new Date('2026-03-20T15:30:00Z').toLocaleDateString();
    expect(result).toBe(expected);
  });
});
