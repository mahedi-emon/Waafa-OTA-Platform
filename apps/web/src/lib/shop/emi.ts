/*
 * EMI calculator maths (Emi board). Instalments are whole taka; the last month absorbs the rounding so the total
 * always equals the amount (0% interest tenures). The calculator's upper bound is a UI limit, not a bank rule.
 */

export const EMI_MAX_AMOUNT = 500_000;
export const EMI_STEP = 1_000;

export type EmiPlan = { monthly: number; lastMonth: number; total: number };

export function emiPlan(amount: number, months: number): EmiPlan {
  const safeMonths = Math.max(1, Math.round(months));
  const total = Math.max(0, Math.round(amount));
  const monthly = Math.ceil(total / safeMonths);
  const lastMonth = total - monthly * (safeMonths - 1);
  return { monthly, lastMonth, total };
}

/** Keeps the amount inside the calculator's range and on its step. */
export function clampEmiAmount(amount: number, minimum: number): number {
  const stepped = Math.round(amount / EMI_STEP) * EMI_STEP;
  return Math.min(EMI_MAX_AMOUNT, Math.max(minimum, stepped));
}
