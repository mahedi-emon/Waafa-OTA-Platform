import { SecretBox } from "../providers/secretBox";

/**
 * Authenticator secrets at rest (issue 234): AES-256-GCM with a key derived from JWT_SECRET, which every API has.
 * Changing JWT_SECRET means every staff member sets up two-step sign-in again (DEPLOY.md); a Super Admin can reset
 * someone from Users.
 */
export function twoStepBox(jwtSecret: string): SecretBox {
  return new SecretBox(`waafa-two-step:${jwtSecret}`);
}
