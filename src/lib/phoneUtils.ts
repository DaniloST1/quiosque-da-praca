/**
 * Format a raw string of digits to Brazilian phone mask:
 *   Celular: (99) 9 9999-9999  [11 digits]
 *   Fixo:    (99) 9999-9999    [10 digits]
 *
 * Strips any non-numeric character first, then applies the mask.
 * Returns the masked string and limits input to 11 digits.
 */
export function formatPhoneBR(raw: string): string {
  // Remove everything that is not a digit
  const digits = raw.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    // e.g. "(1"
    return digits.length === 0 ? '' : `(${digits}`;
  }
  if (digits.length <= 6) {
    // (11) 9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Landline: (11) 9999-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Mobile: (11) 9 9999-9999
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * Strip mask characters and return only the raw digits.
 */
export function unformatPhone(masked: string): string {
  return masked.replace(/\D/g, '');
}
