"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SupportContact = { phoneDisplay: string; phoneE164: string; whatsappE164: string };

const SupportContactContext = createContext<SupportContact | null>(null);

/**
 * The office phone and WhatsApp numbers for client-only screens that cannot read the data layer themselves (the error
 * boundary, the offline notice). Set once by the site layout from Admin › Settings › Contact.
 */
function SupportContactProvider({
  value,
  children,
}: {
  value: SupportContact;
  children: ReactNode;
}) {
  return <SupportContactContext value={value}>{children}</SupportContactContext>;
}

function useSupportContact(): SupportContact | null {
  return useContext(SupportContactContext);
}

export { SupportContactProvider, useSupportContact };
