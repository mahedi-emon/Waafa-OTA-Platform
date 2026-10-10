import { Global, Module } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthController } from "./auth.controller";
import { StaffGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

/** Staff auth, the role guard and the audit log, shared by every admin module. */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, StaffGuard, AuditService],
  exports: [AuthService, StaffGuard, AuditService],
})
export class AuthModule {}
