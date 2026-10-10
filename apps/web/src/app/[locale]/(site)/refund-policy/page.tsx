import type { Metadata } from "next";
import { PolicyPage } from "@/components/content/PolicyPage";
import { getPage } from "@/lib/data/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("refund-policy");
  if (!page) return {};
  return {
    title: page.seo.title ?? page.title,
    ...(page.seo.description || page.summary
      ? { description: page.seo.description ?? page.summary }
      : {}),
    ...(page.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

/** /refund-policy: policy text from Admin › Content › Pages. */
export default function RefundPolicyPage() {
  return <PolicyPage slug="refund-policy" path="/refund-policy" />;
}
