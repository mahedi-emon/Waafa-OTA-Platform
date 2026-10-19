"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

type ToolProps = {
  label: string;
  /** Set for formatting toggles only; action buttons (undo, redo, remove link) leave it out. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/** One toolbar button of the rich text editor (issue 116): keeps the text selection when pressed. */
function RichTextTool({ label, active, disabled = false, onClick, children }: ToolProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-9 cursor-pointer place-items-center rounded-lg text-navy-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40 max-sm:size-11 [&_svg]:size-4",
        active && "hover:bg-navy-800 bg-navy-900 text-white",
      )}
    >
      {children}
    </button>
  );
}

export { RichTextTool };
