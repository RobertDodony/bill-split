/** Format a timestamp (ms since epoch) as a Hungarian date and time, e.g. `2026. 01. 05. 14:03`. */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a timestamp (ms since epoch) as a Hungarian date without the time, e.g. `2026. 01. 05.` */
export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
