import { FeedbackCreateInputSchema } from "@waafa/shared";
import { submitFeedback } from "@/lib/data/content";
import { createSubmissionHandler } from "@/lib/http/handleSubmission";

/** Public feedback (FR-FDB): stored as pending for moderation; the reply carries only the first name. */
export const POST = createSubmissionHandler({
  name: "feedback",
  perMinute: 5,
  maxBytes: 8_192,
  field: "feedback",
  schema: FeedbackCreateInputSchema,
  run: async (input) => {
    const stored = await submitFeedback(input);
    return { firstName: stored.name.split(/\s+/)[0] ?? stored.name };
  },
});
