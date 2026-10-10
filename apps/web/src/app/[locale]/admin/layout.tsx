import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.meta");
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    // PRD §13: Admin lives under /admin and is never indexed (the proxy also sends X-Robots-Tag).
    robots: { index: false, follow: false, nocache: true },
  };
}

/** Admin root: no public header, footer or tab bar; the panel layout adds the admin frame after sign-in. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
