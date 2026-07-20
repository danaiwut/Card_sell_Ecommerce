/** Keep only digits, optionally capped at maxLength. */
export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLength !== undefined ? digits.slice(0, maxLength) : digits;
}

export function isValidPhone(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 9 && digits.length <= 10;
}

export function isValidPostalCode(value: string): boolean {
  return /^\d{5}$/.test(digitsOnly(value));
}
