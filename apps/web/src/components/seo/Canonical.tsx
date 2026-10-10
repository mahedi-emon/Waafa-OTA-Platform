import { absoluteUrl } from "@/lib/siteUrl";

type CanonicalProps = { path: string };

/**
 * Canonical link for fully prerendered pages. `alternates.canonical` in `generateMetadata()` reads the pathname,
 * which Next treats as runtime data on the `/[locale]` shell of a page with no dynamic holes; React hoists this
 * `<link>` into the head instead (Decision D90).
 */
function Canonical({ path }: CanonicalProps) {
  return <link rel="canonical" href={absoluteUrl(path)} />;
}

export { Canonical };
