/** Import / duplicate-filter: never use these as CSV duplicate key. */
export const CONTACT_IMPORT_PHONE_FIELD_IDS = new Set([
  "phone",
  "phone_mobile",
  "phone_company",
  "phone_other",
  "corporate_phone",
]);
