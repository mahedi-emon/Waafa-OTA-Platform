"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { EventBridge } from "./EventBridge";

type Choice = "granted" | "denied" | null;
type Ids = { gtmId?: string; ga4Id?: string; metaPixelId?: string };

type ConsentBarProps = {
  ids: Ids;
  strings: { region: string; text: string; accept: string; decline: string; privacy: string };
};

const KEY = "waafa:consent:v1";
const listeners = new Set<() => void>();
/** Used when the browser refuses storage (private mode): the choice lasts for this visit. */
let memory: Choice = null;

function read(): Choice {
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // fall through to the in-memory choice
  }
  return memory;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function decide(choice: "granted" | "denied") {
  memory = choice;
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    // storage blocked: keep the in-memory choice
  }
  for (const listener of listeners) listener();
}

/** The IDs are validated by the shared schema (letters, digits, dashes only), so they are safe inside the snippets. */
function AnalyticsScripts({ gtmId, ga4Id, metaPixelId }: Ids) {
  return (
    <>
      <EventBridge />
      {gtmId ? (
        <Script id="waafa-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}
      {ga4Id ? (
        <>
          <Script
            id="waafa-ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="waafa-ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script id="waafa-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/**
 * Analytics after consent (PRD §13, issue 102): a small bar asks once; Google Tag Manager, Google Analytics 4 and the
 * Meta Pixel load only after "Accept", and "No thanks" is remembered. Nothing renders on the server, so the choice
 * never causes a hydration mismatch, and the bar sits above the tab bar on phones.
 */
function ConsentBar({ ids, strings }: ConsentBarProps) {
  const choice = useSyncExternalStore<Choice | "unknown">(subscribe, read, () => "unknown");

  if (choice === "granted") return <AnalyticsScripts {...ids} />;
  if (choice !== null) return null;

  return (
    <section
      aria-label={strings.region}
      className="fixed inset-x-3 bottom-[calc(var(--tab-space)+12px)] z-40 flex flex-col gap-3 rounded-2xl bg-navy-900 p-4 text-white shadow-xl sm:flex-row sm:items-center lg:right-auto lg:bottom-4 lg:left-4 lg:max-w-xl"
    >
      <p className="text-[14px] leading-snug text-white/85">
        {strings.text}{" "}
        <Link
          href="/privacy-policy"
          className="font-semibold text-white underline underline-offset-4"
        >
          {strings.privacy}
        </Link>
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => decide("denied")}
          className="inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-[14px] font-semibold text-white ring-1 ring-white/30 outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
        >
          {strings.decline}
        </button>
        <button
          type="button"
          onClick={() => decide("granted")}
          className="inline-flex h-11 cursor-pointer items-center rounded-full bg-white px-5 text-[14px] font-semibold text-navy-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
        >
          {strings.accept}
        </button>
      </div>
    </section>
  );
}

export { ConsentBar };
