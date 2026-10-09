import * as React from "react";
import { cn } from "cn";
import { fieldControlClasses } from "@/components/ui/input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldControlClasses, "min-h-[108px] resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export { Textarea };
