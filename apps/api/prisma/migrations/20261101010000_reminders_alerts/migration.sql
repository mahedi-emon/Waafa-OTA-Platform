-- Issue 243: reminders, personal alerts for the bell, and round-robin lead assignment (additive).
-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "lastLeadAt" TIMESTAMPTZ(3),
ADD COLUMN     "takesLeads" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leadId" TEXT,
    "note" TEXT NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "alertedAt" TIMESTAMPTZ(3),
    "doneAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAlert" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_staffId_doneAt_dueAt_idx" ON "Reminder"("staffId", "doneAt", "dueAt");

-- CreateIndex
CREATE INDEX "Reminder_dueAt_alertedAt_idx" ON "Reminder"("dueAt", "alertedAt");

-- CreateIndex
CREATE INDEX "Reminder_leadId_idx" ON "Reminder"("leadId");

-- CreateIndex
CREATE INDEX "StaffAlert_staffId_readAt_createdAt_idx" ON "StaffAlert"("staffId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAlert" ADD CONSTRAINT "StaffAlert_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

