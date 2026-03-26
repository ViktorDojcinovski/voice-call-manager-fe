import * as z from "zod";
import { isListNameUnique } from "../../utils/listApi";
import api from "../../utils/axiosInstance";

// Factory function to create validation schema with optional excludeListId
const createListSettingsValidationSchema = (excludeListId?: string) => z.object({
  listName: z
    .string()
    .min(1, "List name is required")
    .refine(
      // async check: pull all lists and see if this name exists (excluding current list if editing)
      async (name) => {
        return await isListNameUnique(name, excludeListId);
      },
      { message: "That name already exists — please type a new one." }
    ),

  listPriority: z.enum(["high", "medium", "low"], {
    errorMap: () => ({ message: "List priority is required" }),
  }),
});

// Legacy full create-list schema (no longer used directly but kept for reference)
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
});

// Default schema for create mode (no exclusion)
const listSettingsValidationSchema = createListSettingsValidationSchema();

// Only require exitStrategy and exitStrategyDescription for now
const listExitStrategyValidationSchema = z.object({
  exitStrategy: z.string().min(1, "Exit strategy is required"),
  exitStrategyDescription: z.string().min(1, "Description is required"),
  // exitConditionsPositive: z
  //   .array(
  //     z.object({
  //       value: z.string().min(1, "Select a positive exit condition")
  //     })
  //   )
  //   .min(1, "Add at least one positive exit condition"),
  // exitConditionsNegative: z
  //   .array(
  //     z.object({
  //       value: z.string().min(1, "Select a negative exit condition")
  //     })
  //   )
  //   .min(1, "Add at least one negative exit condition"),
  // steps: z
  //   .array(
  //     z.object({
  //       gap: z.string().min(1, "Gap is required"),
  //       gapUnit: z.enum(["hours", "days"], { errorMap: () => ({ message: "Select a gap unit" }) }),
  //       stepName: z.string().min(1, "Step name is required"),
  //       stepPriority: z.enum(["high", "medium", "low"]).optional(),
  //       defaultAction: z.string().min(1, "Default action is required"),
  //     })
  //   )
  //   .min(1, "Add at least one step"),
});


function getValidationSchemaForStep(
  step: number,
  excludeListId?: string
): z.ZodTypeAny {
  if (step === 1) return createListSettingsValidationSchema(excludeListId);
  return listExitStrategyValidationSchema;
}

export {
  getValidationSchemaForStep,
  createListSettingsValidationSchema,
  listSettingsValidationSchema,
  listExitStrategyValidationSchema,
};
