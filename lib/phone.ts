/**
 * Normalises a raw phone string to E.164 international format (+XXXXXXXXXXX).
 *
 * Handles the common Kenyan input patterns:
 *   07XXXXXXXX   → +2547XXXXXXXX  (Safaricom / Airtel local 10-digit)
 *   01XXXXXXXX   → +2541XXXXXXXX  (Airtel 01X local)
 *   2547XXXXXXXX → +2547XXXXXXXX  (missing leading +)
 *   +2547XX...   → +2547XX...     (already correct — spaces stripped only)
 *
 * Any other number with a leading + is kept as-is (spaces/dashes stripped).
 */
export function normalizePhone(raw: string): string {
  // Strip spaces, dashes, parentheses
  let n = raw.replace(/[\s\-().]/g, '')

  // Kenya local 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 0)
  if (/^0[17]\d{8}$/.test(n)) {
    n = '+254' + n.slice(1)
  }
  // Kenya without leading +: 2547XXXXXXXXX or 2541XXXXXXXXX
  else if (/^254\d{9,11}$/.test(n)) {
    n = '+' + n
  }

  return n
}

/**
 * Returns true if the phone number is in valid E.164 format:
 * a leading + followed by 9–15 digits.
 */
export function isValidInternationalPhone(phone: string): boolean {
  return /^\+\d{9,15}$/.test(phone)
}
