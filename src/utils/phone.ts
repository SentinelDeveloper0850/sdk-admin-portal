// utils/phone.ts (or inline in the component)
export function toZaE164FromNineDigits(nineDigits: string): string {
  const digits = (nineDigits || "").replace(/\D/g, "");
  return `+27${digits}`;
}

export function sanitizeZaNineDigits(input: string): string {
  // digits only
  let d = (input || "").replace(/\D/g, "");

  // if user pasted "0XXXXXXXXX" (10 digits), drop the leading 0
  if (d.length === 10 && d.startsWith("0")) d = d.slice(1);

  // if user pasted "+27XXXXXXXXX" (11/12+ chars), strip +27
  if (d.startsWith("27") && d.length >= 11) d = d.slice(2);

  // disallow first digit 0
  if (d.startsWith("0")) d = d.replace(/^0+/, "");

  // cap to 9 digits
  return d.slice(0, 9);
}
