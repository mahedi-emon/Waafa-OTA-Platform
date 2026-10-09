import { PageTransition } from "@/components/motion/PageTransition";

/** Re-mounts on every navigation, so each new page gets the 420 ms enter (never on the first load). */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
