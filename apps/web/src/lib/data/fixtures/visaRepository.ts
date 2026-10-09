import type { FixtureData } from "@waafa/fixtures";
import { matchesSearch } from "../query";
import type { VisaRepository } from "../types";

export function createFixtureVisaRepository(data: FixtureData): VisaRepository {
  const countries = () => data.visaCountries.filter((country) => country.status === "published");
  const guides = () => data.visaGuides.filter((guide) => guide.status === "published");

  return {
    async listVisaCountries(query = {}) {
      return countries()
        .filter((country) => !query.region || country.region === query.region)
        .filter((country) => query.popular === undefined || country.popular === query.popular)
        .filter((country) => matchesSearch([country.name, country.slug], query.search));
    },

    async getVisaCountry(slug) {
      return countries().find((country) => country.slug === slug) ?? null;
    },

    async listVisaGuides() {
      return guides().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async getVisaGuide(slug) {
      return guides().find((guide) => guide.slug === slug) ?? null;
    },
  };
}
