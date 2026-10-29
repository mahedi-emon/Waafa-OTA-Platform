import type { ProviderId, ProviderSetup } from "./providers";

const live =
  'Shob value save korar por "Test connection" chapun. Sabuj hole card er switch on korun.';
const sandboxFirst =
  'Age Sandbox er value diye test korun; thik thakle Live er value save kore "Live mode" on korun.';

/**
 * How to connect each provider, in plain Banglish for the owner (issue 251), and the values to paste into the
 * provider's own panel. Paths are shown as full addresses on this site with a Copy button; `serverIp` shows the
 * server's public IP for providers that whitelist it. Staff never touch code or the server .env.
 */
export const PROVIDER_SETUP: Partial<Record<ProviderId, ProviderSetup>> = {
  sslcommerz: {
    steps: [
      "developer.sslcommerz.com e sandbox store khulun (free); live er jonno sslcommerz.com theke merchant account (trade licence, bank details lagbe).",
      "SSLCommerz email e Store ID ar Store Password pathabe: niche boshan. API base URL: sandbox e https://sandbox.sslcommerz.com, live e https://securepay.sslcommerz.com.",
      "SSLCommerz merchant panel e IPN settings e niche-r IPN URL boshan. Success, Fail, Cancel URL amra nijei pathai; panel chaile niche theke copy korun.",
      sandboxFirst,
      live,
    ],
    panel: [
      { label: "IPN URL", path: "/api/payments/sslcommerz/ipn" },
      { label: "Success URL", path: "/api/payments/sslcommerz/success" },
      { label: "Fail URL", path: "/api/payments/sslcommerz/fail" },
      { label: "Cancel URL", path: "/api/payments/sslcommerz/cancel" },
      { label: "Server IP (whitelist chaile)", serverIp: true },
    ],
  },
  bkash: {
    steps: [
      "bKash merchant account er jonno bKash er sathe kotha bolun (merchant onboarding); tara Tokenized Checkout er sandbox ar live credential dey.",
      "App key, App secret, Username, Password niche boshan. API base URL bKash er deya host (sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta).",
      "bKash ke niche-r Callback URL ar Server IP din; live er aage tara whitelist kore.",
      sandboxFirst,
      live,
    ],
    panel: [
      { label: "Callback URL", path: "/api/payments/bkash/callback" },
      { label: "Server IP (whitelist)", serverIp: true },
    ],
  },
  nagad: {
    steps: [
      "Nagad merchant account khulun (nagad.com.bd ba Nagad er business team); tara Merchant ID, Nagad er public key dey, ar apnar merchant private key toiri korte bole.",
      "Merchant ID, Merchant private key (jemon pathiyeche temon puro), Nagad public key niche boshan. API base URL Nagad er deya host.",
      "Nagad ke niche-r Callback URL ar Server IP din (tara IP whitelist kore).",
      sandboxFirst,
      live,
    ],
    panel: [
      { label: "Callback URL", path: "/api/payments/nagad/callback" },
      { label: "Server IP (whitelist)", serverIp: true },
    ],
  },
  steadfast: {
    steps: [
      "steadfast.com.bd te merchant account khulun; login kore API section theke API key ar Secret key copy korun.",
      "Niche boshan; API base URL https://portal.packzy.com/api/v1.",
      "Steadfast panel e Webhook URL e niche-r address boshan, jate parcel er status nijei update hoy.",
      live,
    ],
    panel: [{ label: "Webhook URL", path: "/api/couriers/steadfast/webhook" }],
  },
  pathao: {
    steps: [
      "merchant.pathao.com e account khulun; Developer API theke Client ID, Client secret nin; Store ID panel e paben.",
      "Merchant email, password, Client ID, Client secret, Store ID niche boshan.",
      "Pathao panel e Webhook URL e niche-r address boshan.",
      sandboxFirst,
      live,
    ],
    panel: [{ label: "Webhook URL", path: "/api/couriers/pathao/webhook" }],
  },
  redx: {
    steps: [
      "redx.com.bd te merchant account khulun; RedX team ke API token chaan.",
      "API token niche boshan.",
      "RedX ke niche-r Webhook URL din.",
      live,
    ],
    panel: [{ label: "Webhook URL", path: "/api/couriers/redx/webhook" }],
  },
  telegram: {
    steps: [
      "Telegram e @BotFather ke /newbot likhun, ekta naam din; se ekta Bot token debe: niche boshan.",
      "Sales group e bot take add korun, tarpor group e jekono ekta message likhun.",
      'Niche "Find my group" chapun: group er chat ID nijei bose jabe. Tarpor save kore Test connection chapun.',
    ],
  },
  "ssl-wireless": {
    steps: [
      "SSL Wireless er sathe SMS account khulun; tara API token, SID dey.",
      "Value gulo niche boshan. SMS shudhu order ar request er status janate jay, kokhono sign-in code e na.",
      "SSL Wireless chaile niche-r Server IP din.",
      live,
    ],
    panel: [{ label: "Server IP (whitelist)", serverIp: true }],
  },
  bulksmsbd: {
    steps: [
      "bulksmsbd.net e account khulun, Sender ID approve korun; API key copy korun.",
      "Niche boshan. SMS shudhu status message er jonno.",
      "Panel e IP whitelist thakle niche-r Server IP din.",
      live,
    ],
    panel: [{ label: "Server IP (whitelist)", serverIp: true }],
  },
  twilio: {
    steps: [
      "twilio.com e account khulun; Console theke Account SID, Auth token ar ekta number nin.",
      "Niche boshan. SMS shudhu status message er jonno.",
      live,
    ],
  },
  resend: {
    steps: [
      "resend.com e account khulun, Domains e waafasworld.com add kore DNS record gulo apnar domain panel e boshan.",
      "API Keys theke ekta key banan, niche boshan; From address e domain er email din.",
      live,
    ],
  },
  smtp: {
    steps: [
      "Apnar email provider (Gmail Workspace, Zoho, cPanel) er SMTP host, port, username, password nin.",
      "Niche boshan; port 587 ba 465 hoy.",
      live,
    ],
  },
  google: {
    steps: [
      "console.cloud.google.com e project banan; APIs & Services › Credentials › OAuth client ID (Web application).",
      "Authorized redirect URI e niche-r address boshan; Client ID ar Client secret niche boshan.",
      live,
    ],
    panel: [{ label: "Authorized redirect URI", path: "/api/auth/google/callback" }],
  },
  turnstile: {
    steps: [
      "dash.cloudflare.com › Turnstile › Add site; domain waafasworld.com din.",
      "Site key ar Secret key niche boshan.",
      live,
    ],
  },
  ga4: {
    steps: [
      "analytics.google.com e property banan; Data streams › Web theke Measurement ID (G-…) copy korun.",
      "Niche boshan; visitor cookie te rajhi hole tobei data jay.",
    ],
  },
  gtm: {
    steps: ["tagmanager.google.com e container banan; GTM-… ID niche boshan."],
  },
  "meta-pixel": {
    steps: ["Meta Events Manager e pixel banan; Pixel ID niche boshan."],
  },
  "search-console": {
    steps: [
      'search.google.com/search-console e domain add korun, "HTML tag" method bechhe nin.',
      'content="…" er bhitorer code tuku niche boshan, save korun, tarpor Search Console e Verify chapun.',
    ],
  },
  bing: {
    steps: [
      'bing.com/webmasters e site add korun, "HTML Meta Tag" bechhe nin.',
      "content er code tuku niche boshan, tarpor Verify chapun.",
    ],
  },
  sentry: {
    steps: ["sentry.io te project (Next.js) banan; Settings › Client Keys theke DSN niche boshan."],
  },
  glitchtip: {
    steps: ["GlitchTip e project banan; DSN niche boshan."],
  },
  r2: {
    steps: [
      "Ekhon dorkar nei: shob file VPS ei thake (D312). Porey off-site backup chaile Cloudflare R2 bucket banan.",
      "R2 › Manage API tokens theke Access key, Secret key, Account ID, bucket naam niche boshan.",
    ],
  },
  b2: {
    steps: [
      "Ekhon dorkar nei: shob file VPS ei thake (D312). Porey chaile Backblaze B2 bucket banan.",
      "Application key ID, Application key, bucket naam niche boshan.",
    ],
  },
  sabre: {
    steps: [
      "Live flight booking Phase E te ashbe. Sabre er sathe agreement holei credential niche boshan; tokhon porjonto off thakbe.",
    ],
  },
  amadeus: {
    steps: [
      "Live flight booking Phase E te ashbe. Amadeus credential pele niche boshan; tokhon porjonto off thakbe.",
    ],
  },
  travelport: {
    steps: [
      "Live flight booking Phase E te ashbe. Travelport credential pele niche boshan; tokhon porjonto off thakbe.",
    ],
  },
  flyhub: {
    steps: [
      "Live flight booking Phase E te ashbe. FlyHub credential pele niche boshan; tokhon porjonto off thakbe.",
    ],
  },
  bdfare: {
    steps: [
      "Live flight booking Phase E te ashbe. BDFare credential pele niche boshan; tokhon porjonto off thakbe.",
    ],
  },
  hotelbeds: {
    steps: [
      "Live hotel booking Phase E te ashbe. Hotelbeds credential pele niche boshan; tokhon porjonto off thakbe.",
    ],
  },
};
