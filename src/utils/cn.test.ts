import { cn } from '@/utils/cn';

describe('cn', () => {
  it('joins class names with spaces', () => {
    expect(cn('p-4', 'bg-zinc-900')).toBe('p-4 bg-zinc-900');
  });

  it('skips falsy values', () => {
    const busy = false;
    expect(cn('p-4', busy && 'opacity-50', undefined, null, '', 'flex-1')).toBe('p-4 flex-1');
  });

  it('returns an empty string for nothing', () => {
    expect(cn()).toBe('');
  });
});
