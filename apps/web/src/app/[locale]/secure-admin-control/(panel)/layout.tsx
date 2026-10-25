import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { adminAvailable, requireStaff } from "@/lib/admin/adminApi";

async function PanelFrame({ children }: { children: ReactNode }) {
  if (!adminAvailable()) {
    // Per request like the signed-in frame, so pages whose tab title reads the address never block the build.
    await connection();
    const t = await getTranslations("Admin.unavailable");
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center bg-mist-50 px-4">
        <div className="max-w-md rounded-3xl border border-mist-200 bg-white p-8 text-center">
          <h1 className="font-display text-[24px] font-extrabold text-navy-900">{t("title")}</h1>
          <p className="mt-2 text-[15px] text-mist-600">{t("body")}</p>
        </div>
      </main>
    );
  }
  const staff = await requireStaff();
  return <AdminShell staff={staff}>{children}</AdminShell>;
}

function FrameSkeleton() {
  return (
    <div className="min-h-dvh bg-mist-50 lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <div className="hidden bg-midnight-950 lg:block" />
      <div className="flex flex-col">
        <div className="h-16 border-b border-mist-200 bg-white" />
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <Skeleton className="h-4 w-48 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Every signed-in admin page: the frame needs the session, so it streams in behind a skeleton of its final size. */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<FrameSkeleton />}>
      <PanelFrame>{children}</PanelFrame>
    </Suspense>
  );
}
