/**
 * Normalises a Bangladeshi mobile number typed in any common way ("01823-232241", "1823 232241",
 * "+880 1823-232241", "8801823232241") to E.164 ("+8801823232241"). Returns null when it is not a valid
 * BD mobile (01 + operator digit 3-9 + 8 digits).
 */
export function toBdE164(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let national: string;
  if (digits.startsWith("+880")) national = `0${digits.slice(4)}`;
  else if (digits.startsWith("880")) national = `0${digits.slice(3)}`;
  else if (digits.startsWith("0")) national = digits;
  else national = `0${digits}`;
  return /^01[3-9]\d{8}$/.test(national) ? `+88${national}` : null;
}

/** "+8801823232241" → "01823-232241" for display; other numbers are returned unchanged. */
export function formatBdPhone(e164: string): string {
  const match = /^\+880(1[3-9]\d{2})(\d{6})$/.exec(e164);
  return match ? `0${match[1]}-${match[2]}` : e164;
}

/** Builds a wa.me link with an optional prefilled message (FR-GLB-04, FR-FLT-05). */
export function whatsappLink(e164: string, message?: string): string {
  const number = e164.replace(/^\+/, "");
  return message
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${number}`;
}

export type ContactPhone = { display: string; e164: string };

/**
 * Every office number in order: the main one, then the extra numbers from Admin (issue 181). A number repeated in
 * the list is shown once.
 */
export function contactPhones(contact: {
  phoneDisplay: string;
  phoneE164: string;
  extraPhones?: ContactPhone[];
}): ContactPhone[] {
  const phones: ContactPhone[] = [{ display: contact.phoneDisplay, e164: contact.phoneE164 }];
  for (const phone of contact.extraPhones ?? []) {
    if (!phones.some((item) => item.e164 === phone.e164)) phones.push(phone);
  }
  return phones;
}
