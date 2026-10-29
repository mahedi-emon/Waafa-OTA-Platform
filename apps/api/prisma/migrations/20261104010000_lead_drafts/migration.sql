-- Issue 250: partial lead capture (additive).
-- CreateTable
CREATE TABLE "LeadDraft" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "page" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "leadId" TEXT,
    "outcome" TEXT,
    "outcomeAt" TIMESTAMPTZ(3),
    "outcomeBy" TEXT,
    "reminderSentAt" TIMESTAMPTZ(3),

    CONSTRAINT "LeadDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadDraft_phone_module_createdAt_idx" ON "LeadDraft"("phone", "module", "createdAt");

-- CreateIndex
CREATE INDEX "LeadDraft_completedAt_outcome_createdAt_idx" ON "LeadDraft"("completedAt", "outcome", "createdAt");
