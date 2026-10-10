import type { ReactNode } from "react";
import { ShopBar } from "@/components/shop/ShopBar";

/** Waafas World frame: the store bar under the site header on every /shop route; pages render their own <main>. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ShopBar />
      {children}
    </>
  );
}
