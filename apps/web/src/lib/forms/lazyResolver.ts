import type { FieldValues, Resolver } from "react-hook-form";

/**
 * A react-hook-form resolver that loads its validation (zod, the schema, libphonenumber) on the first check instead
 * of with the page (issue 170). The load starts once and is shared by every later check.
 */
export function lazyResolver<T extends FieldValues>(load: () => Promise<Resolver<T>>): Resolver<T> {
  let pending: Promise<Resolver<T>> | null = null;
  return async (values, context, options) => {
    pending ??= load();
    const resolver = await pending;
    return resolver(values, context, options);
  };
}
