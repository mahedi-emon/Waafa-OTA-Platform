import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@waafa/shared";
import { problems } from "../common/problem";
import { AuthService } from "./auth.service";
import type { AuthedRequest, StaffPrincipal } from "./principal";

const ROLES = "waafa:roles";

/** Roles allowed on a controller or route; Super Admin passes every check. No decorator = any signed-in staff. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** The signed-in staff member (set by StaffGuard). */
export const Staff = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthedRequest>();
  if (!request.staff) throw problems.unauthorized();
  return request.staff;
});

/** Requires a valid access token (Authorization: Bearer) on an open session, then checks @Roles. */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    const token =
      typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const staff: StaffPrincipal | null = token ? await this.auth.principal(token) : null;
    if (!staff) throw problems.unauthorized();
    request.staff = staff;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    if (staff.roles.includes("super-admin")) return true;
    if (required.some((role) => staff.roles.includes(role))) return true;
    throw problems.forbidden();
  }
}
