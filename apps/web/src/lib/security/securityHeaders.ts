/**
 * Security headers for every web route (PRD NFR-SEC, issue 102). The Content-Security-Policy allows the site itself,
 * Cloudflare Turnstile, and the analytics hosts that load only after the visitor consents (GTM, GA4, Meta Pixel).
 *
 * Scripts allow 'unsafe-inline' because a nonce-based policy makes every page dynamic (no static shells, no Cache
 * Components); the rest of the policy still blocks plugins, framing, foreign forms and base-tag tricks (D151).
 */

const TURNSTILE = "https://challenges.cloudflare.com";
const ANALYTICS_SCRIPTS = ["https://www.googletagmanager.com", "https://connect.facebook.net"];
const ANALYTICS_CONNECT = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://www.facebook.com",
  "https://connect.facebook.net",
];

type HeaderOptions = {
  /** Next dev (react refresh) needs eval and websockets. */
  development: boolean;
  /** Upgrade insecure requests only when the site itself is served over https. */
  https: boolean;
  /**
   * Who may show the page in a frame: nobody (the admin), or only the site itself (public pages, which the admin's
   * live previews show, D243). Other sites can never frame either.
   */
  framing?: "none" | "self";
  /** The page shows the site itself in a frame (the admin's live previews, D243): frame-src allows 'self'. */
  framesSite?: boolean;
};

export function contentSecurityPolicy({
  development,
  https,
  framing = "none",
  framesSite = false,
}: HeaderOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(development ? ["'unsafe-eval'"] : []),
      TURNSTILE,
      ...ANALYTICS_SCRIPTS,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Admin-uploaded media may live on R2 or another https host; analytics pixels are images too.
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "media-src": ["'self'", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      TURNSTILE,
      ...ANALYTICS_CONNECT,
      ...(development ? ["ws:", "wss:"] : []),
    ],
    "frame-src": [...(framesSite ? ["'self'"] : []), TURNSTILE, "https://www.googletagmanager.com"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": [framing === "self" ? "'self'" : "'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (https && !development) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(options: HeaderOptions): Array<{ key: string; value: string }> {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: options.framing === "self" ? "SAMEORIGIN" : "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
