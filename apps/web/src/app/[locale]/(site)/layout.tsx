import { Toaster } from "@/components/ui/sonner";

/** Public site frame. Header, footer, tab bar and the WhatsApp button arrive with issue #6. */
export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
