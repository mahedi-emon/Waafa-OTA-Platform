-- Provider settings: Active, Sandbox or Live, markup (#107). The per-connection "enabled" flag moves to the
-- provider's setting, so a connection that was on carries over as an active provider using that environment.
CREATE TABLE "IntegrationSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "markupType" TEXT NOT NULL DEFAULT 'none',
    "markupValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationSetting_provider_key" ON "IntegrationSetting"("provider");
CREATE INDEX "IntegrationSetting_kind_isActive_idx" ON "IntegrationSetting"("kind", "isActive");

INSERT INTO "IntegrationSetting" ("id", "provider", "kind", "name", "isActive", "isLive", "updatedAt")
SELECT DISTINCT ON ("provider")
    'mig_' || md5("provider"),
    "provider",
    CASE
        WHEN "provider" IN ('hotelbeds', 'custom-hotel') THEN 'hotel'
        WHEN "provider" IN ('sslcommerz', 'bkash', 'nagad') THEN 'payment'
        ELSE 'flight'
    END,
    "provider",
    "enabled",
    "environment" = 'production',
    CURRENT_TIMESTAMP
FROM "ProviderCredential"
ORDER BY "provider", "enabled" DESC, ("environment" = 'production') DESC;

ALTER TABLE "ProviderCredential" DROP COLUMN "enabled";
