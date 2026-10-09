"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon, PlaneIcon, Share2Icon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const variants = [
  "primary",
  "secondary",
  "navy",
  "soft",
  "ghost",
  "whatsapp",
  "danger",
  "link",
] as const;

/** Every button variant and size, plus the send → sending → sent cycle from the States board. */
function ButtonShowcase() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  function send() {
    setState("sending");
    window.setTimeout(() => setState("sent"), 1200);
    window.setTimeout(() => setState("idle"), 2600);
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button>
          <PlaneIcon /> Search flights
        </Button>
        <Button variant="secondary">Modify search</Button>
        <Button variant="navy">
          View package <ArrowRightIcon />
        </Button>
        <Button variant="soft">Request this fare</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="whatsapp">
          <WhatsAppIcon /> Chat on WhatsApp
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg">Send my query</Button>
        <Button size="sm">
          <ShoppingCartIcon /> Add to cart
        </Button>
        <Button loading>Send</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" size="icon" aria-label="Share this package">
          <Share2Icon />
        </Button>
        <Button variant="link">Read the refund policy</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {state === "sent" ? (
          <Button variant="whatsapp" className="bg-success-600">
            <CheckIcon /> Sent
          </Button>
        ) : (
          <Button loading={state === "sending"} onClick={send}>
            Send request
          </Button>
        )}
        <p className="text-sm text-mist-600">Loading keeps the width; success holds for 1.2 s.</p>
      </div>

      <div className="grid gap-2">
        <p className="type-caption text-mist-600">All variants at every size</p>
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-2">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size}>
                {variant}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-navy-900 p-4">
          <Button variant="white">On dark</Button>
          <Button variant="glass">Glass on dark</Button>
        </div>
      </div>
    </div>
  );
}

export { ButtonShowcase };
