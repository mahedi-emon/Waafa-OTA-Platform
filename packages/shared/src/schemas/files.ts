import { z } from "zod";
import { CUSTOMER_FILE_TYPES, STORAGE_KEY_PATTERN } from "../helpers/customerFiles";
import { PrivateFileSchema } from "./leads";

/** Query of a customer upload (issue 232); the file itself is the raw request body. */
export const CustomerFileUploadQuerySchema = z
  .object({
    kind: PrivateFileSchema.shape.kind,
    name: z.string().trim().min(1).max(120),
  })
  .strict();
export type CustomerFileUploadQuery = z.infer<typeof CustomerFileUploadQuerySchema>;

/** What the browser keeps for an uploaded file and sends back with the form. */
export const CustomerFileUploadedSchema = z.object({
  storageKey: z.string().regex(STORAGE_KEY_PATTERN),
  fileName: z.string(),
  mimeType: z.enum(CUSTOMER_FILE_TYPES),
  sizeBytes: z.number().int().positive(),
});
export type CustomerFileUploaded = z.infer<typeof CustomerFileUploadedSchema>;

/** Staff ask for a signed link by storage key. */
export const CustomerFileLinkInputSchema = z
  .object({ storageKey: z.string().regex(STORAGE_KEY_PATTERN) })
  .strict();

export const CustomerFileLinkSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
  fileName: z.string(),
  mimeType: z.enum(CUSTOMER_FILE_TYPES),
});
export type CustomerFileLink = z.infer<typeof CustomerFileLinkSchema>;
