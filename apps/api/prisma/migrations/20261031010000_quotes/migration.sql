-- Issue 298: quotes on leads (options, validity, a signed customer link, the accepted option). Additive.
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "options" JSONB NOT NULL,
    "validUntil" DATE NOT NULL,
    "notes" TEXT,
    "acceptedOption" TEXT,
    "acceptedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "sentVia" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");
CREATE INDEX "Quote_leadId_createdAt_idx" ON "Quote"("leadId", "createdAt");
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
