/** A local Bangladesh number in its international form: "01712-345678" → "+8801712345678". */
export function toE164(raw: string): string {
  const compact = raw.replace(/[\s()-]/g, "");
  if (/^01\d{9}$/.test(compact)) return `+88${compact}`;
  if (/^8801\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}
