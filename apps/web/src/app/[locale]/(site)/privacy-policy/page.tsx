import type { Metadata } from "next";
import { PolicyPage } from "@/components/content/PolicyPage";
import { getPage } from "@/lib/data/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("privacy-policy");
  if (!page) return {};
  return {
    title: page.seo.title ?? page.title,
    ...(page.seo.description || page.summary
      ? { description: page.seo.description ?? page.summary }
      : {}),
    ...(page.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

/** /privacy-policy: policy text from Admin › Content › Pages. */
export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" path="/privacy-policy" />;
}
