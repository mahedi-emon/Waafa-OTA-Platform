import type { Metadata } from "next";
import { PolicyPage } from "@/components/content/PolicyPage";
import { getPage } from "@/lib/data/content";
import { recordRobots } from "@/lib/seo/indexing";
import { withSocial } from "@/lib/seo/withSocial";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("privacy-policy");
  if (!page) return {};
  return withSocial({
    title: page.seo.title ?? page.title,
    ...(page.seo.description || page.summary
      ? { description: page.seo.description ?? page.summary }
      : {}),
    ...recordRobots(page),
  });
}

/** /privacy-policy: policy text from Admin › Content › Pages. */
export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy-policy" path="/privacy-policy" />;
}
