import * as z from "zod";

export const callManagementValidationSchema = z.object({
  connectionDefinition: z.object({
    callConnect: z.boolean().optional(),
    callTime: z
      .number({
        invalid_type_error: "Call time must be a number",
      })
      .min(0, "Call time cannot be negative")
      .optional(),
  }),
  preventMultiple: z.object({
    mode: z.boolean().optional(),
    preventTime: z
      .number({
        invalid_type_error: "Prevent time must be a number",
      })
      .min(0, "Prevent time cannot be negative")
      .optional(),
  }),
});
