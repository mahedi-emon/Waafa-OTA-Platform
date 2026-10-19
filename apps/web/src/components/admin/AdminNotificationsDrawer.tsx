"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AdminNotificationsBody } from "./AdminNotificationsBody";

type AdminNotificationsDrawerProps = ComponentProps<typeof AdminNotificationsBody> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The bell as a bottom sheet on phones (loaded on first open). */
function AdminNotificationsDrawer({ open, onOpenChange, ...body }: AdminNotificationsDrawerProps) {
  const t = useTranslations("Admin.bell");
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[max(env(safe-area-inset-bottom),12px)]">
        <DrawerHeader className="pb-1 text-left">
          <DrawerTitle className="font-display text-[17px] font-bold text-navy-900">
            {t("title")}
          </DrawerTitle>
        </DrawerHeader>
        <AdminNotificationsBody {...body} />
      </DrawerContent>
    </Drawer>
  );
}

export { AdminNotificationsDrawer };
