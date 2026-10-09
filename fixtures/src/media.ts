import type { MediaSlotSchema } from "@waafa/shared";
import { photo, video } from "./images";
import type { In } from "./input";

/**
 * Page-level photo and video slots (PhotoBrief usage column), edited in Admin › Content › Media library.
 * Real media only: Unsplash photos and Pexels or Mixkit footage. The office slot stays empty until Waafa sends
 * real photos of the Motijheel office (no stand-in).
 */
export const mediaSlots: In<typeof MediaSlotSchema>[] = [
  { key: "home-hero", video: video("hero-sky"), sample: true },
  { key: "flights-header", image: photo("flights"), sample: true },
  { key: "flights-success", image: photo("hero-wing-alt"), sample: true },
  { key: "group-fares-header", image: photo("hero-wing"), sample: true },
  { key: "visa-services-header", video: video("passport"), sample: true },
  { key: "visa-apply-side", image: photo("visa"), sample: true },
  { key: "visa-guide-header", image: photo("visa-alt"), sample: true },
  { key: "visa-track-header", image: photo("visa-alt"), sample: true },
  { key: "printing-header", image: photo("printing"), sample: true },
  { key: "printing-quote-side", image: photo("printing-alt"), sample: true },
  { key: "trading-header", video: video("port"), sample: true },
  { key: "trading-rfq-side", image: photo("trading-alt"), sample: true },
  { key: "shop-service-printing", image: photo("printing"), sample: true },
];
