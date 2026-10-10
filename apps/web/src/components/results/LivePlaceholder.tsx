import { getTranslations } from "next-intl/server";
import { CloudOff } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * The Live body slot (FR-GS-02) until Phase E: shown only if an admin switches a module to Live while no provider is
 * connected. Never pretends to have live availability.
 */
async function LivePlaceholder() {
  const t = await getTranslations("Results.live");
  return (
    <EmptyState
      icon={CloudOff}
      title={t("title")}
      description={t("body")}
      action={
        <Button asChild>
          <Link href="/contact">{t("contact")}</Link>
        </Button>
      }
    />
  );
}

export { LivePlaceholder };
