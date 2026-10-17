import { z } from "zod";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createTagSchema = z.object({
  name: z.string().min(1, t("validationRequired")).max(30),
  color: z.string().regex(HEX_COLOR_REGEX, t("validationRequired")),
});

export type CreateTagFormValues = z.infer<typeof createTagSchema>;
