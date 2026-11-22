export type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy ones: `cn('p-4', busy && 'opacity-50')`. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
