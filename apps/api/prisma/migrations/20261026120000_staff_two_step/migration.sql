-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "totpEnabledAt" TIMESTAMPTZ(3),
ADD COLUMN     "totpLastStep" INTEGER,
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "StaffRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastIp" TEXT,
    "firstSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedUntil" TIMESTAMPTZ(3),

    CONSTRAINT "StaffDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ip" TEXT,
    "device" TEXT,
    "newDevice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffLoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffRecoveryCode_userId_codeHash_key" ON "StaffRecoveryCode"("userId", "codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDevice_userId_deviceHash_key" ON "StaffDevice"("userId", "deviceHash");

-- CreateIndex
CREATE INDEX "StaffLoginEvent_userId_createdAt_idx" ON "StaffLoginEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffLoginEvent_createdAt_idx" ON "StaffLoginEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "StaffRecoveryCode" ADD CONSTRAINT "StaffRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDevice" ADD CONSTRAINT "StaffDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLoginEvent" ADD CONSTRAINT "StaffLoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

