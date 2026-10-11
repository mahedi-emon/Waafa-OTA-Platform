"use client";

import Form from "next/form";
import type { FormEvent, ReactNode } from "react";

type FilterFormProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * A GET filter form for listing pages (Packages-m-filters board): it stays on the same route with new search
 * params through a client navigation (next/form), and a radio, checkbox or select change applies at once. The
 * submit button inside keeps working for keyboard users and without JavaScript.
 */
function FilterForm({ children, className, ...props }: FilterFormProps) {
  function applyChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    const instant =
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLInputElement &&
        (target.type === "radio" || target.type === "checkbox"));
    if (instant) event.currentTarget.requestSubmit();
  }

  return (
    <Form action="" scroll={false} replace onChange={applyChange} className={className} {...props}>
      {children}
    </Form>
  );
}

export { FilterForm };
