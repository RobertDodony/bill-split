export function formatPrice(value: number) {
  return value.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
}

export function formatDate(ms: number) {
  return new Date(ms).toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
