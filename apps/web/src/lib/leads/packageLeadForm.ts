import {
  PreferredContactSchema,
  RoomSharingSchema,
  type LeadCreateInput,
  type TourPackage,
} from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * Package query step 2 (PackageDetail-query, FR-PKG-06): departure (a fixed date or any date), travellers, room
 * sharing, contact preference, notes and consent. Messages are keys under "Packages.errors" or "Leads.errors".
 */

export const ANY_DATE = "any";

export const packageQuerySchema = z
  .object({
    departure: z.string(),
    adults: z.number().int().min(1).max(40),
    children: z.number().int().min(0).max(20),
    infants: z.number().int().min(0).max(20),
    roomSharing: RoomSharingSchema,
    preferredContact: PreferredContactSchema,
    notes: z.string().max(1000),
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (!values.departure) issue("departure", "departureRequired");
    if (values.infants > values.adults) issue("infants", "infantsOverAdults");
    if (!values.consent) issue("consent", "consentRequired");
  });

export type PackageQueryInput = z.input<typeof packageQuerySchema>;
export type PackageQueryValues = z.output<typeof packageQuerySchema>;

export function packageQueryDefaults(
  pkg: Pick<TourPackage, "departures" | "anyDate" | "prices">,
): PackageQueryInput {
  const first = pkg.departures[0]?.date;
  return {
    departure: first ?? (pkg.anyDate ? ANY_DATE : ""),
    adults: 2,
    children: 0,
    infants: 0,
    roomSharing: pkg.prices[0]?.sharing ?? "twin",
    preferredContact: "call",
    notes: "",
    consent: false,
  };
}

export function buildPackageLead(args: {
  contact: ContactStepValues;
  query: PackageQueryValues;
  pkg: Pick<TourPackage, "id" | "title">;
  page: string;
}): LeadCreateInput {
  const { contact, query, pkg } = args;
  return {
    contact: contactToLead(contact, query.preferredContact, ""),
    payload: {
      module: "packages",
      packageId: pkg.id,
      packageTitle: pkg.title,
      departure: query.departure === ANY_DATE ? "any" : query.departure,
      travellers: { adults: query.adults, children: query.children, infants: query.infants },
      roomSharing: query.roomSharing,
      ...(query.notes.trim() ? { notes: query.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}

/**
 * Indicative total for the booking card (PackageDetail "Estimated total"): adults at the chosen room sharing,
 * children at the child-with-bed price and infants at the infant price. Missing child prices fall back to the
 * adult price, a missing infant price to zero.
 */
export function estimatePackageTotal(
  prices: TourPackage["prices"],
  travellers: Pick<PackageQueryInput, "adults" | "children" | "infants" | "roomSharing">,
): number {
  const priceOf = (sharing: string) => prices.find((price) => price.sharing === sharing)?.price;
  const adult = priceOf(travellers.roomSharing) ?? prices[0]?.price ?? 0;
  const child = priceOf("child-with-bed") ?? adult;
  const infant = priceOf("infant") ?? 0;
  return travellers.adults * adult + travellers.children * child + travellers.infants * infant;
}
