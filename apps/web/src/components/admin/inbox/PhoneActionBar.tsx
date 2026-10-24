import type { ReactNode } from "react";

type PhoneActionBarProps = {
  /** Names the bar for screen readers ("Quick steps"). */
  label: string;
  children: ReactNode;
};

/**
 * The inbox detail's bottom bar on phones (ADMIN.md §5.5): the contact buttons and the main step stay in thumb reach
 * while the person scrolls. Hidden from 768 px, where the step card is always in view. Pages leave room for it.
 */
function PhoneActionBar({ label, children }: PhoneActionBarProps) {
  return (
    <div
      role="region"
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-mist-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:hidden"
    >
      {children}
    </div>
  );
}

export { PhoneActionBar };
