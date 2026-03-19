import { z } from "zod";

export const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  accountId: z.string().optional(),
  email: z.string().email("Must be a valid email"),
  phone: z.union([
    z.string().min(10),
    z.object({
      mobile: z.object({
        number: z.string().nullable(),
        isBad: z.boolean().optional(),
        isFavourite: z.boolean().optional(),
      }).optional(),
      company: z.object({
        number: z.string().nullable(),
        isBad: z.boolean().optional(),
        isFavourite: z.boolean().optional(),
      }).optional(),
      other: z.object({
        number: z.string().nullable(),
        isBad: z.boolean().optional(),
        isFavourite: z.boolean().optional(),
      }).optional(),
    }),
  ]).refine((val) => {
    if (typeof val === "string") return val.trim().length >= 10;
    const p = val as { mobile?: { number?: string }; company?: { number?: string }; other?: { number?: string } };
    return !!(p.mobile?.number?.trim() || p.company?.number?.trim() || p.other?.number?.trim());
  }, "At least one phone number required"),
  tags: z.string().optional(),
  linkedIn: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  state: z.string().optional(),
  city: z.string().optional(),
});
