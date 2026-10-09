import type { z } from "zod";

/**
 * Fixtures are written as schema *inputs* (defaults may be left out) and parsed into outputs by the
 * repositories, so a fixture that breaks a rule fails loudly in tests instead of rendering wrong data.
 */
export type In<T extends z.ZodType> = z.input<T>;
