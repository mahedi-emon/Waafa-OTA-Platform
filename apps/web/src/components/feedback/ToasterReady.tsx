"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { markToasterReady } from "./notify";

/** The public toaster; tells `notify` it can show toasts once sonner listens (children's effects run first). */
function ToasterReady() {
  useEffect(() => {
    markToasterReady();
  }, []);
  return <Toaster />;
}

export { ToasterReady };
