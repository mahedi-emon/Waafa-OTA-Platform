import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import {
  CustomProviderInputSchema,
  IntegrationSettingInputSchema,
  ProviderConnectionInputSchema,
  ProviderEnvironmentSchema,
  ProviderKeySchema,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput } from "../common/problem";
import { IntakeKeyGuard } from "../common/serverKey";
import { ProvidersService } from "./providers.service";

const TurnstileVerifySchema = z
  .object({ token: z.string().max(4096).default(""), ip: z.string().max(64).optional() })
  .strict();

const target = (provider: string, environment: string) =>
  [
    parseInput(ProviderKeySchema, provider),
    parseInput(ProviderEnvironmentSchema, environment),
  ] as const;

/**
 * Admin › Settings › Integrations (#82, #107): providers per category, their Active and Sandbox / Live switches,
 * markup and credentials per environment (secrets never leave the API, issue 284). Super Admin only (PRD §4).
 */
@Controller("admin/providers")
@UseGuards(StaffGuard)
export class AdminProvidersController {
  constructor(@Inject(ProvidersService) private readonly providers: ProvidersService) {}

  @Get()
  @Roles("super-admin")
  list() {
    return this.providers.list();
  }

  @Post()
  @Roles("super-admin")
  @HttpCode(201)
  addCustom(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.providers.addCustom(staff, parseInput(CustomProviderInputSchema, body));
  }

  @Post(":provider/setting")
  @Roles("super-admin")
  @HttpCode(200)
  saveSetting(
    @Staff() staff: StaffPrincipal,
    @Param("provider") provider: string,
    @Body() body: unknown,
  ) {
    return this.providers.saveSetting(
      staff,
      parseInput(ProviderKeySchema, provider),
      parseInput(IntegrationSettingInputSchema, body),
    );
  }

  @Delete(":provider")
  @Roles("super-admin")
  @HttpCode(204)
  async removeCustom(@Staff() staff: StaffPrincipal, @Param("provider") provider: string) {
    await this.providers.removeCustom(staff, parseInput(ProviderKeySchema, provider));
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

/**
 * What the web server may know about integrations (#107): manual or provider mode for flights and hotels, ready flags
 * for the rest. No names, keys or secrets.
 */
@Controller("public/integrations")
@UseGuards(IntakeKeyGuard)
export class PublicIntegrationsController {
  constructor(@Inject(ProvidersService) private readonly providers: ProvidersService) {}

  @Get("status")
  @Header("cache-control", "private, max-age=60")
  status() {
    return this.providers.publicStatus();
  }

  /** A visitor's Turnstile token, checked with the secret saved in Admin (issue 284); passes while Turnstile is off. */
  @Post("turnstile/verify")
  @HttpCode(200)
  @Header("cache-control", "no-store")
  verifyTurnstile(@Body() body: unknown) {
    const input = parseInput(TurnstileVerifySchema, body);
    return this.providers.verifyTurnstile(input.token, input.ip);
  }
}
