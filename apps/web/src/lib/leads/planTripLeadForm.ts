import { PreferredContactSchema, daysBetween, type LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * Plan My Trip (PlanTrip, FR-PKG-07): places, dates or a month, who is going, budget and style, then the request.
 * Messages are keys under "PlanTrip.errors" or "Leads.errors".
 */

export const BUDGET_BANDS = [
  "any",
  "under-30000",
  "30000-60000",
  "60000-100000",
  "over-100000",
] as const;
export const INTERESTS = [
  "beach",
  "mountains",
  "city",
  "food",
  "shopping",
  "culture",
  "adventure",
  "relaxed",
] as const;
export const TRIP_FOR = ["family", "couple", "friends", "solo", "office"] as const;
export const HOTEL_CLASSES = ["3", "4", "5", "resort", "any"] as const;

export const planTripSchema = z
  .object({
    places: z.array(z.string().trim().min(1).max(60)).max(6),
    notSure: z.boolean(),
    dateMode: z.enum(["exact", "month"]),
    startDate: z.string(),
    endDate: z.string(),
    month: z.string(),
    nights: z.number().int().min(1).max(60),
    adults: z.number().int().min(1).max(40),
    children: z.number().int().min(0).max(20),
    infants: z.number().int().min(0).max(20),
    budgetBand: z.enum(BUDGET_BANDS),
    hotelClass: z.enum(HOTEL_CLASSES),
    tripFor: z.enum(["", ...TRIP_FOR]),
    interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
    includeFlights: z.boolean(),
    visaHelp: z.boolean(),
    preferredContact: PreferredContactSchema,
    notes: z.string().max(1000),
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (values.places.length === 0 && !values.notSure) issue("places", "placesRequired");
    if (values.dateMode === "exact") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.startDate)) issue("startDate", "startRequired");
      else if (
        /^\d{4}-\d{2}-\d{2}$/.test(values.endDate) &&
        daysBetween(values.startDate, values.endDate) < 1
      ) {
        issue("endDate", "endAfterStart");
      }
    } else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.month)) {
      issue("month", "monthRequired");
    }
    if (values.infants > values.adults) issue("infants", "infantsOverAdults");
    if (!values.consent) issue("consent", "consentRequired");
  });

export type PlanTripInput = z.input<typeof planTripSchema>;
export type PlanTripValues = z.output<typeof planTripSchema>;

export function planTripDefaults(place?: string): PlanTripInput {
  return {
    places: place ? [place] : [],
    notSure: false,
    dateMode: "month",
    startDate: "",
    endDate: "",
    month: "",
    nights: 5,
    adults: 2,
    children: 0,
    infants: 0,
    budgetBand: "any",
    hotelClass: "any",
    tripFor: "",
    interests: [],
    includeFlights: true,
    visaHelp: false,
    preferredContact: "whatsapp",
    notes: "",
    consent: false,
  };
}

export function buildPlanTripLead(args: {
  contact: ContactStepValues;
  plan: PlanTripValues;
  notSureLabel: string;
  page: string;
}): LeadCreateInput {
  const { contact, plan } = args;
  const exact = plan.dateMode === "exact";
  const nights =
    exact && plan.endDate ? Math.max(1, daysBetween(plan.startDate, plan.endDate)) : plan.nights;
  return {
    contact: contactToLead(contact, plan.preferredContact, ""),
    payload: {
      module: "plan-trip",
      destinations: plan.places.length > 0 ? plan.places : [args.notSureLabel],
      ...(exact ? { startDate: plan.startDate } : { month: plan.month }),
      nights,
      travellers: { adults: plan.adults, children: plan.children, infants: plan.infants },
      budgetBand: plan.budgetBand,
      hotelClass: plan.hotelClass,
      ...(plan.tripFor ? { tripFor: plan.tripFor } : {}),
      interests: [...plan.interests],
      includeFlights: plan.includeFlights,
      visaHelp: plan.visaHelp,
      ...(plan.notes.trim() ? { notes: plan.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
