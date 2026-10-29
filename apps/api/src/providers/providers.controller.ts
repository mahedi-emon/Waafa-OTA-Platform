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

/** Find my group (issue 252): the token typed in the form, or empty to use the saved one. */
const TelegramGroupsSchema = z.object({ botToken: z.string().trim().max(100).optional() }).strict();

/** A test SMS to a phone staff type in (issue 252). */
const TestSmsSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{10,18}$/, "Type a phone number, e.g. 01712-345678"),
  })
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

  /** The server's public IP, for providers that whitelist it (issue 251); null when it can't be found. */
  @Get("server-ip")
  @Roles("super-admin")
  serverIp() {
    return this.providers.serverIp();
  }

  /** The groups the Telegram bot has seen, so staff pick the sales group instead of typing its ID (issue 252). */
  @Post("telegram/groups")
  @Roles("super-admin")
  @HttpCode(200)
  telegramGroups(@Staff() staff: StaffPrincipal, @Body() body: unknown) {
    return this.providers.findTelegramGroups(
      staff,
      parseInput(TelegramGroupsSchema, body ?? {}).botToken,
    );
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

  @Post(":provider/:environment/test-sms")
  @Roles("super-admin")
  @HttpCode(200)
  testSms(
    @Staff() staff: StaffPrincipal,
    @Param("provider") provider: string,
    @Param("environment") environment: string,
    @Body() body: unknown,
  ) {
    return this.providers.sendTestSms(
      staff,
      ...target(provider, environment),
      parseInput(TestSmsSchema, body).phone,
    );
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
