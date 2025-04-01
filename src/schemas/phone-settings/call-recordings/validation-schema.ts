import * as z from "zod";

export const recordingsManagementValidationSchema = z.object({
  enableCallRecording: z.boolean().optional(),
  excludePhonesStartingWith: z
    .string()
    .optional()
    .refine(
      (val) => val === "" || /^[0-9*#+]+$/.test(val as string),
      "Invalid phone expression"
    ),
  includeOnlyPhonesStartingWith: z
    .string()
    .optional()
    .refine(
      (val) => val === "" || /^[0-9*#+]+$/.test(val as string),
      "Invalid phone expression"
    ),
});
