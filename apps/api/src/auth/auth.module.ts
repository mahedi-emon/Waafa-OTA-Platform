import { Global, Module } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthController } from "./auth.controller";
import { StaffGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { TwoStepService } from "./twoStep.service";

/** Staff auth, the role guard and the audit log, shared by every admin module. */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, TwoStepService, StaffGuard, AuditService],
  exports: [AuthService, TwoStepService, StaffGuard, AuditService],
})
export class AuthModule {}
