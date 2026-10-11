import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ProviderConnectionInputSchema,
  ProviderEnvironmentSchema,
  ProviderIdSchema,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput } from "../common/problem";
import { ProvidersService } from "./providers.service";

const target = (provider: string, environment: string) =>
  [
    parseInput(ProviderIdSchema, provider),
    parseInput(ProviderEnvironmentSchema, environment),
  ] as const;

/** Admin › Settings › Integrations (#82): external API connections, Super Admin only (PRD §4). */
@Controller("admin/providers")
@UseGuards(StaffGuard)
export class AdminProvidersController {
  constructor(@Inject(ProvidersService) private readonly providers: ProvidersService) {}

  @Get()
  @Roles("super-admin")
  list() {
    return this.providers.list();
  }

  @Post(":provider/:environment")
  @Roles("super-admin")
  @HttpCode(200)
  save(
    @Staff() staff: StaffPrincipal,
    @Param("provider") provider: string,
    @Param("environment") environment: string,
    @Body() body: unknown,
  ) {
    return this.providers.save(
      staff,
      ...target(provider, environment),
      parseInput(ProviderConnectionInputSchema, body),
    );
  }

  @Post(":provider/:environment/test")
  @Roles("super-admin")
  @HttpCode(200)
  test(
    @Staff() staff: StaffPrincipal,
    @Param("provider") provider: string,
    @Param("environment") environment: string,
  ) {
    return this.providers.test(staff, ...target(provider, environment));
  }

  @Delete(":provider/:environment")
  @Roles("super-admin")
  @HttpCode(204)
  async remove(
    @Staff() staff: StaffPrincipal,
    @Param("provider") provider: string,
    @Param("environment") environment: string,
  ) {
    await this.providers.remove(staff, ...target(provider, environment));
  }
}
