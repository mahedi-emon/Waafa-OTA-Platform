import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

/** Inline spinner, 18 px, for buttons only (States board). Page loads use skeletons or the W loader. */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-[18px] animate-spin motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Spinner };
