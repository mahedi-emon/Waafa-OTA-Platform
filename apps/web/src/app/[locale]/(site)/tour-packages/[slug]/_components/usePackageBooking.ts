"use client";

import { use } from "react";
import { PackageBookingContext } from "./PackageBookingProvider";

/** The booking card choices shared on a package page; throws outside PackageBookingProvider. */
export function usePackageBooking() {
  const booking = use(PackageBookingContext);
  if (!booking) throw new Error("usePackageBooking needs PackageBookingProvider");
  return booking;
}
