import type { FieldValues, Resolver } from "react-hook-form";

/**
 * A react-hook-form resolver that loads its validation (zod, the schema, libphonenumber) on the first check instead
 * of with the page (issues 170 and 236). The load starts once and is shared by every later check. Schemas that
 * transform their values keep their input and output types.
 */
export function lazyResolver<TInput extends FieldValues, TContext = unknown, TOutput = TInput>(
  load: () => Promise<Resolver<TInput, TContext, TOutput>>,
): Resolver<TInput, TContext, TOutput> {
  let pending: Promise<Resolver<TInput, TContext, TOutput>> | null = null;
  return async (values, context, options) => {
    pending ??= load();
    const resolver = await pending;
    return resolver(values, context, options);
  };
}
