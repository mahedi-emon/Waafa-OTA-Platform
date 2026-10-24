"use client";

import { useTranslations } from "next-intl";
import { describeHref } from "@/lib/admin/linkTargets";
import { SITE_URL } from "@/lib/siteUrl";
import { readOptions, useOptionsOf } from "./useContentOptions";

type LinkTargetTextProps = { href: string | undefined; empty: string };

/** Where a link goes, in words ("Page · Visa", "Tour package · Bali temples"), for lists of links. */
function LinkTargetText({ href, empty }: LinkTargetTextProps) {
  const t = useTranslations("Admin.link");
  const target = href ? describeHref(href, SITE_URL) : null;
  useOptionsOf(target?.kind === "record" ? [target.key] : []);
  if (!target) return <>{empty}</>;
  switch (target.kind) {
    case "page":
      return <>{`${t("kinds.page")} · ${t(`pages.${target.page}`)}`}</>;
    case "record": {
      const options = readOptions(target.key);
      const title =
        options.items.find((item) => item.id === target.id)?.title ??
        (options.status === "ready" ? t("missing") : "…");
      return <>{`${t(`groups.${target.key}.one`)} · ${title}`}</>;
    }
    case "web":
      return <>{`${t("kinds.web")} · ${target.url}`}</>;
    case "phone":
      return <>{`${t("kinds.phone")} · ${target.number}`}</>;
    case "email":
      return <>{`${t("kinds.email")} · ${target.address}`}</>;
    case "path":
      return <>{`${t("kinds.path")} · ${target.path}`}</>;
  }
}

export { LinkTargetText };
