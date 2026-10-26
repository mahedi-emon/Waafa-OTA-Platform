/** Printing and trading request choices, without zod (issue 236). */

export const PRINTING_SERVICES = [
  "toner-supply",
  "printer-repair",
  "new-printers",
  "paper-supplies",
  "managed-printing",
] as const;

export const PRINTING_FREQUENCIES = ["one-off", "weekly", "monthly", "quarterly"] as const;

export const TRADING_DIRECTIONS = ["import", "export", "sourcing"] as const;

export const DELIVERY_TERMS = ["exw", "fob", "cif", "ddp", "other"] as const;
