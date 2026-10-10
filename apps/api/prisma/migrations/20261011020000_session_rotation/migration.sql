-- Refresh tokens rotated in the last 30 seconds may be presented again by a concurrent request (#66).
ALTER TABLE "StaffSession" ADD COLUMN "rotatedAt" TIMESTAMPTZ(3);
