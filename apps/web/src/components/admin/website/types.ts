import type { HomeSectionKey } from "@/lib/admin/homeSections";

/** One home section as the manager shows it, already in words (D0 R7). */
export type ManagedSection = {
  key: HomeSectionKey;
  name: string;
  /** What the section shows, in one line. */
  lead: string;
  enabled: boolean;
  version: number;
  /** The stored record, saved back with the changed words. */
  data: Record<string, unknown>;
  /** The section's heading words can be changed here. */
  headings: boolean;
  kicker: string;
  title: string;
  subtitle: string;
  /** What the site shows when a box is left empty ("" = that line is left out). */
  defaults: { kicker: string; title: string; subtitle: string };
  thumb: string | null;
  /** Where the section's content is edited. */
  links: Array<{ label: string; href: string }>;
};

/** The hero's words and media for the hero editor. */
export type HeroData = {
  title: string;
  titleAccent: string;
  lead: string;
  rotatingLabel: string;
  rotating: string[];
  /** The whole home copy, saved back with the hero changed. */
  content: Record<string, unknown>;
  version: number;
  media: { kind: "photo" | "video" | "none"; src: string | null; phoneVersion: boolean };
  /** The hero's photo or video, in Site images. */
  mediaHref: string;
};
