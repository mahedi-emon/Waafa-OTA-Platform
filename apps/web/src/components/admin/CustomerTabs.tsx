import { getTranslations } from "next-intl/server";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { hasRole, requireStaff } from "@/lib/admin/adminApi";

type CustomerTabsProps = { current: "customers" | "newsletter" };

/**
 * Customers and Newsletter as one place with two tabs (ADMIN.md §3.1, issue 229). The Newsletter tab shows only to the
 * roles that may open the list (admin and content editors; Super Admin passes everything).
 */
async function CustomerTabs({ current }: CustomerTabsProps) {
  const [staff, t] = await Promise.all([requireStaff(), getTranslations("Admin.customerTabs")]);
  const newsletter = hasRole(staff, "admin", "content-editor");
  if (!newsletter && current === "customers") return null;
  return (
    <StatusTabs
      label={t("label")}
      current={current}
      items={[
        { value: "customers", label: t("customers"), href: "/secure-admin-control/customers" },
        ...(newsletter
          ? [
              {
                value: "newsletter",
                label: t("newsletter"),
                href: "/secure-admin-control/subscribers",
              },
            ]
          : []),
      ]}
    />
  );
}

export { CustomerTabs };
