import { z } from "zod";

export const csvFileImportStep_1_ValidationSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === "text/csv", {
    message: "Please upload a CSV file",
  }),
  hasHeader: z.boolean(),
});
