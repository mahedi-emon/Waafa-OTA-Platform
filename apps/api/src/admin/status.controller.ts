import { Controller, Get, Header, HttpCode, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput } from "../common/problem";
import { StatusService } from "./status.service";

const JobIdSchema = z.string().regex(/^[A-Za-z0-9:_-]{1,80}$/, "Unknown job");
const ActionSchema = z.enum(["retry", "discard"]);

/** Admin › Status (issue 238): health of the system and the dead-letter list; Admin and Super Admin. */
@Controller("admin/status")
@UseGuards(StaffGuard)
export class AdminStatusController {
  constructor(@Inject(StatusService) private readonly status: StatusService) {}

  @Get()
  @Roles("admin")
  @Header("cache-control", "no-store")
  overview() {
    return this.status.overview();
  }

  @Get("failed")
  @Roles("admin")
  @Header("cache-control", "no-store")
  failed() {
    return this.status.failed();
  }

  @Post("failed/:id/:action")
  @Roles("admin")
  @HttpCode(204)
  async decide(
    @Staff() staff: StaffPrincipal,
    @Param("id") id: string,
    @Param("action") action: string,
  ) {
    await this.status.decide(staff, parseInput(JobIdSchema, id), parseInput(ActionSchema, action));
  }
}
