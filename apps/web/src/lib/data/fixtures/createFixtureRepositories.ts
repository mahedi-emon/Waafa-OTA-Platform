import { loadFixtures, type FixtureData } from "@waafa/fixtures";
import type { Repositories } from "../types";
import { createFixtureContentRepository } from "./contentRepository";
import { createFixtureLeadsRepository } from "./leadsRepository";
import { createFixtureSettingsRepository } from "./settingsRepository";
import { createFixtureShopRepository } from "./shopRepository";
import { createFixtureTravelRepository } from "./travelRepository";
import { createFixtureVisaRepository } from "./visaRepository";

/** Every repository backed by the parsed, frozen Sample fixtures. */
export function createFixtureRepositories(data: FixtureData = loadFixtures()): Repositories {
  return {
    settings: createFixtureSettingsRepository(data),
    content: createFixtureContentRepository(data),
    travel: createFixtureTravelRepository(data),
    visa: createFixtureVisaRepository(data),
    shop: createFixtureShopRepository(data),
    leads: createFixtureLeadsRepository(),
  };
}
