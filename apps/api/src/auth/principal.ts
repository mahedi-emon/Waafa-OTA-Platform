import type { Role } from "@waafa/shared";

/** The signed-in staff member attached to a request by the auth guard. */
export type StaffPrincipal = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  sessionId: string;
};

/** Fastify request augmented by the auth guard. */
export type AuthedRequest = { staff?: StaffPrincipal; headers: Record<string, unknown> };
