import type { Metadata } from "next";
import { PolicyPage } from "@/components/content/PolicyPage";
import { getPage } from "@/lib/data/content";
import { recordRobots } from "@/lib/seo/indexing";
import { withSocial } from "@/lib/seo/withSocial";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("terms-and-conditions");
  if (!page) return {};
  return withSocial({
    title: page.seo.title ?? page.title,
    ...(page.seo.description || page.summary
      ? { description: page.seo.description ?? page.summary }
      : {}),
    ...recordRobots(page),
  });
}

/** /terms-and-conditions: policy text from Admin › Content › Pages. */
export default function TermsAndConditionsPage() {
  return <PolicyPage slug="terms-and-conditions" path="/terms-and-conditions" />;
}
