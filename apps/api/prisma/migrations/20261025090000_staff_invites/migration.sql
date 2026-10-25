-- D0 R9: staff added without a password get an invite email; only the token's hash is stored.
ALTER TABLE "StaffUser" ADD COLUMN "inviteHash" TEXT;
ALTER TABLE "StaffUser" ADD COLUMN "inviteExpiresAt" TIMESTAMPTZ(3);

CREATE UNIQUE INDEX "StaffUser_inviteHash_key" ON "StaffUser"("inviteHash");
