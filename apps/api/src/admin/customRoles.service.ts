import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CustomRoleInputSchema, IdSchema, type CustomRoleInput } from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Custom roles (issue 244): a name for a bundle of built-in roles (never Super Admin or Admin), e.g. "Senior sales" =
 * Travel sales + Visa officer. A person's token carries what their custom roles grant from their next sign-in; editing
 * or deleting a role signs its people out so the change applies at once. Super Admin only, audited.
 */
@Injectable()
export class CustomRolesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list() {
    const [roles, staff] = await Promise.all([
      this.prisma.customRole.findMany({ orderBy: { name: "asc" } }),
      this.prisma.staffUser.findMany({
        where: { customRoleIds: { isEmpty: false } },
        select: { customRoleIds: true },
      }),
    ]);
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      grants: role.grants,
      people: staff.filter((person) => person.customRoleIds.includes(role.id)).length,
    }));
  }

  private async signOutHolders(roleId: string) {
    const holders = await this.prisma.staffUser.findMany({
      where: { customRoleIds: { has: roleId } },
      select: { id: true },
    });
    await this.prisma.staffSession.updateMany({
      where: { userId: { in: holders.map((person) => person.id) }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async create(actor: StaffPrincipal, input: CustomRoleInput) {
    const exists = await this.prisma.customRole.findUnique({ where: { name: input.name } });
    if (exists) throw problems.conflict("A role with this name exists", "exists");
    const role = await this.prisma.customRole.create({
      data: { name: input.name, grants: [...new Set(input.grants)] },
    });
    await this.audit.record({
      actor,
      action: "role.create",
      entity: "role",
      entityId: role.name,
      after: { grants: role.grants },
    });
    return this.list();
  }

  async update(actor: StaffPrincipal, id: string, input: CustomRoleInput) {
    const role = await this.prisma.customRole.findUnique({ where: { id } });
    if (!role) throw problems.notFound("Role not found");
    const clash = await this.prisma.customRole.findFirst({
      where: { name: input.name, id: { not: id } },
    });
    if (clash) throw problems.conflict("A role with this name exists", "exists");
    await this.prisma.customRole.update({
      where: { id },
      data: { name: input.name, grants: [...new Set(input.grants)] },
    });
    await this.signOutHolders(id);
    await this.audit.record({
      actor,
      action: "role.update",
      entity: "role",
      entityId: input.name,
      before: { name: role.name, grants: role.grants },
      after: input,
    });
    return this.list();
  }

  async remove(actor: StaffPrincipal, id: string) {
    const role = await this.prisma.customRole.findUnique({ where: { id } });
    if (!role) throw problems.notFound("Role not found");
    const holders = await this.prisma.staffUser.count({ where: { customRoleIds: { has: id } } });
    if (holders > 0)
      throw problems.conflict(
        `${holders} ${holders === 1 ? "person has" : "people have"} this role; take it off them first`,
        "inUse",
      );
    await this.prisma.customRole.delete({ where: { id } });
    await this.audit.record({
      actor,
      action: "role.delete",
      entity: "role",
      entityId: role.name,
      before: { grants: role.grants },
    });
    return this.list();
  }
}

const roleId = (value: string) => {
  if (!IdSchema.safeParse(value).success) throw problems.notFound();
  return value;
};

/** Settings › Roles (issue 244): Super Admin only. Everyone signed in may read the names for the Users screen. */
@Controller("admin/roles")
@UseGuards(StaffGuard)
export class AdminCustomRolesController {
  constructor(@Inject(CustomRolesService) private readonly roles: CustomRolesService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Post()
  @Roles("super-admin")
  create(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.roles.create(staff, parseInput(CustomRoleInputSchema, body));
  }

  @Patch(":id")
  @Roles("super-admin")
  update(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.roles.update(staff, roleId(id), parseInput(CustomRoleInputSchema, body));
  }

  @Delete(":id")
  @HttpCode(200)
  @Roles("super-admin")
  remove(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.roles.remove(staff, roleId(id));
  }
}
