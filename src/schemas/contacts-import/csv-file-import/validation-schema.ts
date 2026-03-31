import { z } from "zod";

import { CONTACT_IMPORT_PHONE_FIELD_IDS } from "./phone-field-ids";

function hasMobilePhoneMapped(mapping: Record<string, string>) {
  const m = mapping.phone_mobile ?? mapping.phone;
  return !!(m && String(m).trim().length > 0);
}

export const csvFileImportStep_1_ValidationSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "text/csv", {
    message: "Please upload a CSV file",
  }),
  hasHeader: z.boolean(),
});

export const TIMEZONE_MODE = {
  EMPTY: "",
  USE_FROM_CSV_MAP: "use_from_csv_map",
  AUTO_DETECT: "auto_detect",
  MANUAL: "manual",
} as const;

export const csvFileImportStep_2_ValidationSchema = z
  .object({
    duplicateField: z.string().min(1, "Please select a duplicate filter field"),
    timezoneMode: z.string(),
    timezoneManual: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.timezoneMode === TIMEZONE_MODE.MANUAL) {
        return !!data.timezoneManual && data.timezoneManual.trim().length > 0;
      }
      return true;
    },
    { message: "Please select a timezone", path: ["timezoneManual"] }
  )
  .refine(
    (data) => !CONTACT_IMPORT_PHONE_FIELD_IDS.has(data.duplicateField),
    {
      message: "Duplicate filter cannot be a phone field. Choose email or Customer ID.",
      path: ["duplicateField"],
    }
  );

const REQUIRED_MAPPING_FIELDS = ["first_name", "last_name", "accountWebsite"];

export const csvFileImportStep_3_ValidationSchema = z
  .object({
    mapping: z.record(z.string()),
    duplicateField: z.string(),
  })
  .passthrough()
  .refine(
    (data) => {
      const mapping = data.mapping || {};
      const hasRequired = REQUIRED_MAPPING_FIELDS.every(
        (fieldId) => mapping[fieldId] && String(mapping[fieldId]).trim().length > 0
      );
      const hasMobile = hasMobilePhoneMapped(mapping);
      const hasDuplicateField = data.duplicateField
        ? mapping[data.duplicateField] &&
          String(mapping[data.duplicateField]).trim().length > 0
        : true;
      return hasRequired && hasMobile && hasDuplicateField;
    },
    {
      message:
        "Please map First Name, Last Name, Company Website, Mobile phone, and the Duplicate Filter Field to CSV columns. Company and Other phone are optional.",
      path: ["mapping"],
    }
  );

export const EXISTING_CONTACTS_ACTION = {
  MOVE_UNASSIGNED: "move_unassigned",
  MOVE_ALL: "move_all",
  SKIP: "skip",
} as const;

export const csvFileImportStep_4_ValidationSchema = z.object({
  selectedListId: z.string().min(1, "Please select a list to assign"),
  existingContactsAction: z
    .enum(["move_unassigned", "move_all", "skip"])
    .optional()
    .default("skip"),
});
