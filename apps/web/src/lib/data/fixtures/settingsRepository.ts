import type { FixtureData } from "@waafa/fixtures";
import type { BookingModule } from "@waafa/shared";
import { byAdminOrder, isScheduledNow } from "../query";
import type { SettingsRepository } from "../types";

export function createFixtureSettingsRepository(data: FixtureData): SettingsRepository {
  return {
    async getSiteSettings() {
      return data.siteSettings;
    },

    async getContactSettings() {
      return data.contactSettings;
    },

    async getMenu(key) {
      const menu = data.menus.find((candidate) => candidate.key === key);
      return { key, items: (menu?.items ?? []).filter((item) => item.visible) };
    },

    async getFooterSettings() {
      // "We accept" lists only the methods that are live (FR-FTR-04).
      const { paymentMethods, ...footer } = data.footerSettings;
      return { ...footer, paymentMethods: paymentMethods.filter((method) => method.enabled) };
    },

    async getActiveAnnouncement(now) {
      return (
        data.announcements.find(
          (announcement) => announcement.enabled && isScheduledNow(announcement, now),
        ) ?? null
      );
    },

    async getPublicConfig() {
      const state = (module: BookingModule) => {
        const entry = data.bookingModes.find((candidate) => candidate.module === module);
        if (!entry) throw new Error(`The booking mode for "${module}" is missing`);
        return { mode: entry.mode, liveLocked: entry.liveLocked, lockReason: entry.lockReason };
      };
      return {
        modes: {
          flights: state("flights"),
          hotels: state("hotels"),
          packages: state("packages"),
          shopPayment: state("shopPayment"),
        },
        onlinePaymentLive: data.paymentSettings.onlinePaymentLive,
        accountsLive: data.siteSettings.accountsLive,
        codLimit: data.paymentSettings.codLimit,
        maintenance: data.maintenanceSettings,
      };
    },

    async getPaymentSettings() {
      return data.paymentSettings;
    },

    async getShippingSettings() {
      return data.shippingSettings;
    },

    async getEmiSettings() {
      return data.emiSettings;
    },

    async getLeadFormSettings() {
      return data.leadFormSettings;
    },

    async getTrackingSettings() {
      return data.trackingSettings;
    },

    async getSearchSettings() {
      return data.searchSettings;
    },

    async getHomeContent() {
      return data.homeContent;
    },
    async listHomeSections() {
      return byAdminOrder(data.homeSections.filter((section) => section.enabled));
    },
  };
}
