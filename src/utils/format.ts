/**
 * Format number into Indonesian Rupiah format with exactly 1 space after Rp (e.g., Rp 15.000)
 */
export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  const isNegative = value < 0;
  const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(value));
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format compact number with thousand separator
 */
export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format raw string or number into Indonesian thousand dot formatted string (e.g. 15.000)
 */
export function formatThousands(value: string | number): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
}

/**
 * Parse thousand dot formatted string back to number
 */
export function parseThousands(value: string | number): number {
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Format date for human readability in Indonesian
 */
export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time (HH:mm)
 */
export function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
