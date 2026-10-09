import type {
  VisaApplicationSchema,
  VisaCountrySchema,
  VisaGuideSchema,
  VisaTypeDetailSchema,
} from "@waafa/shared";
import { photo } from "./images";
import type { In } from "./input";

type VisaType = In<typeof VisaTypeDetailSchema>;
type Checklist = VisaType["checklist"];

/* ------------------------------------------------------------------------------------------------
 * Visa services (FR-VISA). Tourist, business, student, medical and transit only: no work permits,
 * recruitment or employment visas (PRD §2). Times and our service charges are samples from the
 * Visa board; embassy fees stay unset (null) until the visa desk enters them, except Thailand,
 * whose sample fees appear on the VisaCountry board.
 * ---------------------------------------------------------------------------------------------- */

const BASE: Checklist = [
  {
    title: "Passport",
    detail:
      "Valid for at least 6 months from your travel date, with two blank pages. Bring old passports too.",
  },
  {
    title: "Two recent photos",
    detail: "35 × 45 mm, white background, taken in the last 3 months.",
  },
  {
    title: "Bank statement and solvency certificate",
    detail: "Last 6 months, signed and sealed by your bank.",
  },
  { title: "National ID card", detail: "A clear copy of both sides." },
];

const EXTRA: Record<VisaType["type"], Checklist> = {
  tourist: [
    {
      title: "Proof of work or study",
      detail:
        "Job: no-objection letter and visiting card. Business owners: business registration papers. Students: student ID and letter from the institution.",
    },
    {
      title: "Hotel booking and flight booking",
      detail: "We can make both for you; no payment needed until the visa is approved.",
    },
  ],
  business: [
    {
      title: "Invitation letter from the host company",
      detail: "On company letterhead, naming you, your dates and the purpose.",
    },
    {
      title: "Your company’s letter",
      detail: "Introducing you and confirming the trip, with the company’s registration papers.",
    },
  ],
  medical: [
    {
      title: "Hospital appointment letter",
      detail: "From the hospital abroad, with the treatment and dates.",
    },
    {
      title: "Medical reports from Bangladesh",
      detail: "Your doctor’s referral and recent reports.",
    },
    {
      title: "Attendant’s documents",
      detail: "If someone travels with you, the same documents for them.",
    },
  ],
  student: [
    { title: "Admission letter", detail: "From the university or school." },
    {
      title: "Academic certificates",
      detail: "SSC, HSC and any degree certificates with transcripts.",
    },
    {
      title: "Sponsor’s bank statement",
      detail: "If a parent or sponsor pays, their statement and a letter.",
    },
  ],
  transit: [
    { title: "Onward ticket", detail: "Your confirmed ticket to the final destination." },
    {
      title: "Visa for your final destination",
      detail: "If the country you are flying to needs one.",
    },
  ],
};

const FEE_NOTE = "Set by the embassy; we confirm it before you pay";

function visaType(
  type: VisaType["type"],
  processingTime: string,
  serviceCharge: number,
  extra: Partial<Pick<VisaType, "stay" | "entry" | "validity" | "embassyFee">> = {},
): VisaType {
  const { embassyFee = null, ...facts } = extra;
  return {
    type,
    processingTime,
    checklist: [...BASE, ...EXTRA[type]],
    embassyFee,
    ...(embassyFee === null ? { embassyFeeNote: FEE_NOTE } : {}),
    serviceCharge,
    ...facts,
  };
}

const COUNTRY_FAQS = [
  {
    question: "Can I apply without a job letter?",
    answer:
      "Yes, if you show other proof of ties to Bangladesh, such as business papers or property documents. We tell you what fits your case.",
  },
  {
    question: "How much money should my bank statement show?",
    answer:
      "There is no fixed number, but it should cover your trip comfortably. We look at your statement and advise before you submit.",
  },
  {
    question: "Can my family apply together?",
    answer:
      "Yes. Add everyone in one application. Children need their birth certificate and both parents’ consent.",
  },
];

type Country = In<typeof VisaCountrySchema>;

function country(
  slug: string,
  name: string,
  flagCode: string,
  region: Country["region"],
  submission: Country["submission"],
  types: VisaType[],
  extra: Partial<Pick<Country, "popular" | "guideSlug">> = {},
): Country {
  return {
    id: `visa-${slug}`,
    slug,
    name,
    flagCode,
    region,
    submission,
    types,
    faqs: COUNTRY_FAQS,
    status: "published",
    sample: true,
    ...extra,
  };
}

export const visaCountries: Country[] = [
  country(
    "thailand",
    "Thailand",
    "TH",
    "south-east-asia",
    "embassy",
    [
      visaType("tourist", "About 10 working days", 3500, {
        stay: "Up to 60 days",
        entry: "Single entry",
        validity: "3 months",
        embassyFee: 4000,
      }),
      visaType("business", "About 10 working days", 4500, {
        stay: "Up to 90 days",
        entry: "Single or multiple",
        validity: "3 months to 1 year",
        embassyFee: 6000,
      }),
      visaType("medical", "About 7 working days", 3500, {
        stay: "Up to 90 days",
        entry: "Single entry",
        validity: "3 months",
        embassyFee: 4000,
      }),
      visaType("student", "About 15 working days", 5000, {
        stay: "Length of the course",
        entry: "Single entry",
        validity: "3 months, extended in Thailand",
        embassyFee: 6000,
      }),
    ],
    { popular: true, guideSlug: "thailand" },
  ),
  country(
    "malaysia",
    "Malaysia",
    "MY",
    "south-east-asia",
    "evisa",
    [
      visaType("tourist", "About 5 working days", 3000),
      visaType("business", "About 5 working days", 3500),
      visaType("medical", "About 5 working days", 3000),
      visaType("student", "About 10 working days", 4500),
    ],
    { popular: true, guideSlug: "malaysia" },
  ),
  country("singapore", "Singapore", "SG", "south-east-asia", "embassy", [
    visaType("tourist", "About 7 working days", 3800),
    visaType("business", "About 7 working days", 4200),
    visaType("transit", "About 7 working days", 3800),
  ]),
  country(
    "united-arab-emirates",
    "United Arab Emirates",
    "AE",
    "middle-east",
    "evisa",
    [
      visaType("tourist", "About 4 working days", 2500),
      visaType("transit", "About 4 working days", 2500),
    ],
    { popular: true, guideSlug: "united-arab-emirates" },
  ),
  country(
    "india",
    "India",
    "IN",
    "south-asia",
    "visa-centre",
    [
      visaType("tourist", "About 7 working days", 1500),
      visaType("medical", "About 7 working days", 1500),
      visaType("business", "About 7 working days", 2000),
      visaType("student", "About 10 working days", 2500),
    ],
    { popular: true, guideSlug: "india" },
  ),
  country("turkiye", "Türkiye", "TR", "europe", "visa-centre", [
    visaType("tourist", "About 15 working days", 4000),
    visaType("business", "About 15 working days", 4500),
    visaType("medical", "About 15 working days", 4000),
  ]),
  country("vietnam", "Vietnam", "VN", "south-east-asia", "evisa", [
    visaType("tourist", "About 5 working days", 2800),
    visaType("business", "About 5 working days", 3200),
  ]),
  country("schengen", "Schengen area", "EU", "europe", "visa-centre", [
    visaType("tourist", "About 15 working days", 6500),
    visaType("business", "About 15 working days", 7000),
    visaType("student", "About 20 working days", 7500),
  ]),
  country("indonesia", "Indonesia", "ID", "south-east-asia", "evisa", [
    visaType("tourist", "About 5 working days", 3200),
    visaType("business", "About 5 working days", 3600),
  ]),
  country(
    "nepal",
    "Nepal",
    "NP",
    "south-asia",
    "on-arrival",
    [visaType("tourist", "On arrival", 1000)],
    { guideSlug: "nepal" },
  ),
  country("maldives", "Maldives", "MV", "south-asia", "on-arrival", [
    visaType("tourist", "On arrival", 1000),
  ]),
  country("china", "China", "CN", "east-asia", "visa-centre", [
    visaType("tourist", "About 7 working days", 4500),
    visaType("business", "About 7 working days", 5000),
    visaType("student", "About 10 working days", 5500),
    visaType("medical", "About 7 working days", 4500),
  ]),
  country("japan", "Japan", "JP", "east-asia", "embassy", [
    visaType("tourist", "About 7 working days", 4500),
    visaType("business", "About 7 working days", 5000),
    visaType("student", "About 10 working days", 5500),
  ]),
  country("united-kingdom", "United Kingdom", "GB", "europe", "visa-centre", [
    visaType("tourist", "About 15 working days", 7500),
    visaType("business", "About 15 working days", 8000),
    visaType("student", "About 15 working days", 8500),
    visaType("transit", "About 15 working days", 7500),
  ]),
  country("united-states", "United States", "US", "americas", "interview", [
    visaType("tourist", "Interview date varies", 8500),
    visaType("business", "Interview date varies", 9000),
    visaType("student", "Interview date varies", 9500),
    visaType("transit", "Interview date varies", 8500),
  ]),
  country("canada", "Canada", "CA", "americas", "online", [
    visaType("tourist", "About 30 working days", 8000),
    visaType("business", "About 30 working days", 8500),
    visaType("student", "About 30 working days", 9000),
  ]),
];

/* ------------------------------------------------------------------------------------------------
 * Visa Guide (FR-VGD-01): editorial guides linked both ways with the country pages.
 * ---------------------------------------------------------------------------------------------- */

export const visaGuides: In<typeof VisaGuideSchema>[] = [
  {
    id: "guide-thailand",
    slug: "thailand",
    countrySlug: "thailand",
    title: "Thailand visa from Bangladesh: documents, fees and how long it takes",
    summary:
      "Most Bangladeshi travellers need a visa before flying to Thailand. The application is simple when the papers are in order; most refusals come from a weak bank statement or a missing employer letter.",
    cover: photo("visa"),
    sections: [
      {
        id: "who-needs-a-visa",
        heading: "Who needs a visa",
        body: "<p>If you hold a Bangladeshi passport, you need a visa for tourism, business, treatment or study in Thailand. Children need their own visa, even when they travel on a parent’s booking.</p>",
      },
      {
        id: "which-visa",
        heading: "Which visa to choose",
        body: "<p>Choose the visa that matches why you are going. A tourist visa covers holidays and visiting friends. Business trips, treatment and study each have their own visa with extra papers.</p>",
      },
      {
        id: "checklist",
        heading: "Your document checklist",
        body: "<ul><li>Passport valid for 6 months, with two blank pages</li><li>Two photos, 35 × 45 mm, white background</li><li>Bank statement for 6 months with a solvency certificate</li><li>No-objection letter from your employer, or business registration papers</li><li>Hotel booking for your whole stay</li><li>Return flight booking</li><li>National ID card copy</li></ul>",
      },
      {
        id: "fees",
        heading: "Fees",
        body: "<p>You pay two amounts: the embassy fee, which goes to the embassy, and our service charge for preparing and following your file. We give you a receipt for both.</p>",
      },
      {
        id: "how-long",
        heading: "How long it takes",
        body: "<p>Plan for about two weeks from the day your papers are complete. Apply three to six weeks before you fly so there is time to fix anything the embassy asks for.</p>",
      },
      {
        id: "refusals",
        heading: "Mistakes that cause refusals",
        body: "<ul><li>A bank statement with a large deposit just before applying, with no explanation.</li><li>An employer letter without a signature, seal or contact number.</li><li>Photos with a coloured background or glasses.</li><li>Hotel and flight dates that don’t match the dates on the form.</li></ul>",
      },
    ],
    tips: [
      "Apply three to six weeks before you fly.",
      "Keep the bank statement steady for the last six months.",
    ],
    updatedAt: "2026-10-06",
    readingMinutes: 6,
    status: "published",
    sample: true,
  },
  {
    id: "guide-malaysia",
    slug: "malaysia",
    countrySlug: "malaysia",
    title: "Malaysia eVisa for Bangladeshis: apply online, step by step",
    summary:
      "The Malaysia eVisa is applied for online. Clear scans and matching dates decide how fast it comes back.",
    cover: photo("kualalumpur"),
    sections: [
      {
        id: "documents",
        heading: "What to prepare",
        body: "<p>A passport valid for six months, a recent photo on a white background, your return ticket, the hotel booking and a six-month bank statement.</p>",
      },
      {
        id: "steps",
        heading: "How we apply",
        body: "<p>We check your scans, fill in the online form, pay the fee with you and send the eVisa to your email and WhatsApp as soon as it is issued.</p>",
      },
    ],
    updatedAt: "2026-10-05",
    readingMinutes: 5,
    status: "published",
    sample: true,
  },
  {
    id: "guide-india",
    slug: "india",
    countrySlug: "india",
    title: "Indian visa for medical treatment: hospital letters, attendants and timing",
    summary:
      "Treatment in India needs a medical visa, a hospital letter and, for anyone travelling with you, an attendant visa.",
    cover: photo("visa-alt"),
    sections: [
      {
        id: "hospital-letter",
        heading: "The hospital letter",
        body: "<p>Ask the hospital for a letter naming the patient, the treatment and the dates. It must match the dates on your application.</p>",
      },
      {
        id: "attendants",
        heading: "Attendants",
        body: "<p>Up to two attendants can apply with the patient. Each needs their own documents and a letter explaining the relationship.</p>",
      },
    ],
    updatedAt: "2026-10-04",
    readingMinutes: 7,
    status: "published",
    sample: true,
  },
  {
    id: "guide-uae",
    slug: "united-arab-emirates",
    countrySlug: "united-arab-emirates",
    title: "Dubai tourist visa: what to prepare and when to apply",
    summary:
      "The UAE tourist visa is issued online. Most files are ready in a few working days when the passport scan is clear.",
    cover: photo("dubai"),
    sections: [
      {
        id: "prepare",
        heading: "What to prepare",
        body: "<p>A clear colour scan of your passport, a recent photo on a white background, your return ticket and the hotel booking.</p>",
      },
      {
        id: "when",
        heading: "When to apply",
        body: "<p>Apply two to three weeks before you fly, and earlier before Eid holidays when processing slows down.</p>",
      },
    ],
    updatedAt: "2026-10-03",
    readingMinutes: 4,
    status: "published",
    sample: true,
  },
  {
    id: "guide-nepal",
    slug: "nepal",
    countrySlug: "nepal",
    title: "Nepal on arrival: what to carry for a smooth entry",
    summary:
      "Bangladeshi passports get a visa on arrival in Nepal. A few papers make the queue at the airport quick.",
    cover: photo("nepal"),
    sections: [
      {
        id: "carry",
        heading: "What to carry",
        body: "<p>Your passport, a return ticket, the hotel booking and a passport photo. Fill in the arrival form online before you fly to save time.</p>",
      },
    ],
    updatedAt: "2026-10-02",
    readingMinutes: 3,
    status: "published",
    sample: true,
  },
];

/**
 * Admin visa pipeline (FR-VISA-04). Clearly fictional applicants; phone numbers use the unassigned 010
 * prefix so they can never reach a real person. No passport numbers are stored, and files are private.
 */
export const visaApplications: In<typeof VisaApplicationSchema>[] = [
  {
    id: "vapp-1",
    reference: "VSA-261008-0007",
    countrySlug: "thailand",
    visaType: "tourist",
    applicantName: "Sample Applicant",
    applicants: 2,
    phone: "+8801000000001",
    travelDate: "2026-11-20",
    status: "documents-pending",
    documents: [
      {
        kind: "passport-bio",
        fileName: "passport-bio.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 412_000,
      },
      { kind: "photo", fileName: "photo.jpg", mimeType: "image/jpeg", sizeBytes: 96_000 },
    ],
    history: [
      { status: "new", at: "2026-10-08T11:20:00+06:00", by: "Website" },
      { status: "documents-pending", at: "2026-10-08T12:05:00+06:00", by: "Visa desk" },
    ],
    createdAt: "2026-10-08T11:20:00+06:00",
    sample: true,
  },
  {
    id: "vapp-2",
    reference: "VSA-261005-0003",
    countrySlug: "malaysia",
    visaType: "tourist",
    applicantName: "Sample Traveller",
    applicants: 1,
    phone: "+8801000000002",
    travelDate: "2026-10-28",
    status: "submitted-to-embassy",
    documents: [
      {
        kind: "bank-statement",
        fileName: "bank-statement.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1_240_000,
      },
    ],
    history: [
      { status: "new", at: "2026-10-05T10:00:00+06:00", by: "Website" },
      { status: "documents-verified", at: "2026-10-06T15:30:00+06:00", by: "Visa desk" },
      { status: "submitted-to-embassy", at: "2026-10-07T11:00:00+06:00", by: "Visa desk" },
    ],
    createdAt: "2026-10-05T10:00:00+06:00",
    sample: true,
  },
];
