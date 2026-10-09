"use client";

import type { MouseEvent } from "react";
import { whatsappLink } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

type FloatingWhatsAppProps = {
  e164: string;
  /** Admin template; `{page}` becomes the current page's name (FR-GLB-04). */
  messageTemplate: string;
  label: string;
};

/** "Visa Services | Waafa" → "Visa Services" (the metadata title template). */
function currentPageName(): string {
  return document.title.split(/ [|·] /)[0]?.trim() || document.title;
}

/**
 * Floating WhatsApp button (FR-GLB-04): bottom right on desktop, above the tab bar on phones. The prefilled message
 * names the page the visitor is on, filled in at the moment of the tap.
 */
function FloatingWhatsApp({ e164, messageTemplate, label }: FloatingWhatsAppProps) {
  function fillMessage(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.href = whatsappLink(
      e164,
      messageTemplate.replace("{page}", currentPageName()),
    );
  }

  return (
    <a
      href={whatsappLink(e164)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={fillMessage}
      className="fixed right-4 bottom-[calc(var(--tab-space)+16px)] z-30 grid size-14 place-items-center rounded-full bg-whatsapp-700 text-white shadow-[0_14px_30px_-12px_rgb(14_122_71/0.75)] transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 lg:right-7 lg:bottom-7 lg:size-[60px]"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

export { FloatingWhatsApp };
