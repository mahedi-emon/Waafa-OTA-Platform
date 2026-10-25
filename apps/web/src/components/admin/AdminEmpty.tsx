import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "cn";

type AdminEmptyProps = {
  title: string;
  /** What will appear here and what to do next. */
  body?: string;
  /** The next step, usually a primary button. */
  action?: ReactNode;
  /** One to three icons for what belongs here (the first is the main one). */
  icons?: LucideIcon[];
  /** The title's element: a paragraph inside a page, the page's h1 when the state is the whole page (not found). */
  titleAs?: "p" | "h1";
  className?: string;
};

const SIDE_TILE =
  "relative top-1.5 flex size-11 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-mist-200";

/**
 * Empty state for admin lists and panels (ADMIN.md §5.9; layered icons after 21st.dev serafimcloud/empty-state):
 * says what will appear here and offers the next step. Calm: no hover motion.
 */
function AdminEmpty({
  title,
  body,
  action,
  icons = [Inbox],
  titleAs: Title = "p",
  className,
}: AdminEmptyProps) {
  const [MainIcon = Inbox, LeftIcon, RightIcon] = icons;
  return (
    <div className={cn("flex flex-col items-center gap-2 px-5 py-12 text-center", className)}>
      <div aria-hidden="true" className="isolate flex justify-center pb-2">
        {LeftIcon ? (
          <span className={cn(SIDE_TILE, "left-2.5 -rotate-6")}>
            <LeftIcon className="size-5 text-mist-500" />
          </span>
        ) : null}
        <span className="relative z-10 flex size-12 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-mist-200">
          <MainIcon className="size-6 text-brand-700" />
        </span>
        {RightIcon ? (
          <span className={cn(SIDE_TILE, "right-2.5 rotate-6")}>
            <RightIcon className="size-5 text-mist-500" />
          </span>
        ) : null}
      </div>
      <Title className="font-display text-[17px] font-bold text-navy-900">{title}</Title>
      {body ? <p className="max-w-md text-[14.5px] leading-relaxed text-mist-600">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export { AdminEmpty };
