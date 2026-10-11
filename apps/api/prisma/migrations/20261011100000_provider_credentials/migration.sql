-- External API connections with encrypted secrets (#82).
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL,
    "secrets" JSONB NOT NULL,
    "note" TEXT,
    "healthOk" BOOLEAN,
    "healthMessage" TEXT,
    "healthAt" TIMESTAMPTZ(3),
    "updatedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderCredential_provider_environment_key" ON "ProviderCredential"("provider", "environment");
