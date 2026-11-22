import { CREATED_AT } from '@/test-utils/fixtures';
import { formatDate } from '@/utils/date';

describe('formatDate', () => {
  it('formats a timestamp as a Hungarian date and time', () => {
    expect(formatDate(CREATED_AT)).toBe('2026. 01. 05. 14:03');
  });

  it('pads single-digit months, days, hours and minutes', () => {
    expect(formatDate(new Date(2025, 8, 9, 7, 5).getTime())).toBe('2025. 09. 09. 07:05');
  });
});
