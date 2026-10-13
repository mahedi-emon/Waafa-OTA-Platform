"use client";

import { use } from "react";
import { VisaTypeContext } from "./VisaTypeProvider";

/** The visa type chosen on a country page; throws outside VisaTypeProvider. */
export function useVisaType() {
  const choice = use(VisaTypeContext);
  if (!choice) throw new Error("useVisaType needs VisaTypeProvider");
  return choice;
}
