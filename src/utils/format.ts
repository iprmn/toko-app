/**
 * Format number into Indonesian Rupiah format with exactly 1 space after Rp (e.g., Rp 15.000).
 * Batas nilai penuh adalah di bawah 10 juta (misal Rp 9.000.000).
 * Jika puluhan/ratusan juta atau lebih, disederhanakan dengan 1 angka di belakang koma: 10,0 JT, 324,5 JT, 1,0 M, 10,0 M, dst.
 */
export function formatRupiah(value: number, forceFull = false): string {
  if (isNaN(value)) return 'Rp 0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  if (forceFull || absVal < 10_000_000) {
    const formatted = new Intl.NumberFormat('id-ID').format(absVal);
    return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
  }

  const numFormatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  let formatted: string;
  if (absVal >= 1_000_000_000_000) {
    const t = absVal / 1_000_000_000_000;
    formatted = `${numFormatter.format(t)} T`;
  } else if (absVal >= 1_000_000_000) {
    const m = absVal / 1_000_000_000;
    formatted = `${numFormatter.format(m)} M`;
  } else {
    const jt = absVal / 1_000_000;
    formatted = `${numFormatter.format(jt)} JT`;
  }

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Selalu format angka menjadi nominal Rupiah lengkap tanpa penyingkatan (misal Rp 15.000.000)
 */
export function formatRupiahFull(value: number): string {
  return formatRupiah(value, true);
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
