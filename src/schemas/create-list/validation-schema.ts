import * as z from "zod";

const createListValidationSchema = z.object({
  listName: z.string(),
  listPriority: z.enum(["high", "medium", "low"]),
  listType: z.enum(["static", "dynamic"]),
  listSharing: z.enum(["notShared", "shared"]),
  listOwner: z.string().optional(),
  listActive: z.boolean().optional(),
  restrictToOwnedLeads: z.boolean().optional(),
  restrictToOwnedAccounts: z.boolean().optional(),
  tags: z.string().optional(),
  filters: z
    .array(
      z.object({
        value: z.string(),
        field: z.enum(["city", "state", "country"]),
        operator: z.enum(["equals", "notEquals", "contains"]),
      })
    )
    .optional(),
  crossFilters: z
    .array(
      z.object({
        value: z.string(),
        operator: z.enum(["equals", "notEquals", "contains"]),
        taskField: z.enum(["status", "priority"]),
      })
    )
    .optional(),
});

const listSettingsValidationSchema = createListValidationSchema.pick({
  listName: true,
  listPriority: true,
  listType: true,
  listSharing: true,
  listOwner: true,
  listActive: true,
  restrictToOwnedLeads: true,
  restrictToOwnedAccounts: true,
  tags: true,
});

const listFiltersValidationSchema = createListValidationSchema.pick({
  filters: true,
  crossFilters: true,
});

function getValidationSchemaForStep(step: number) {
  if (step === 1) return listSettingsValidationSchema;
  if (step === 2) return listFiltersValidationSchema;
  return undefined;
}

export {
  getValidationSchemaForStep,
  listSettingsValidationSchema,
  listFiltersValidationSchema,
};
