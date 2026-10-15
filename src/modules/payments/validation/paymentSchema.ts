import { z } from "zod";

export const createPaymentCycleSchema = z.object({
  schoolId: z.string().min(1, "paymentValidationSchoolRequired"),
  periodStart: z.string().min(1, "paymentValidationDateRequired"),
  periodEnd: z.string().min(1, "paymentValidationDateRequired"),
  notes: z.string().max(500, "paymentValidationNotesTooLong").optional(),
  amount: z.number().nonnegative("paymentValidationAmountNegative").optional(),
  currency: z.string().min(1, "paymentValidationCurrencyRequired").optional(),
})
  // A period's own amount comes with its currency, or neither is set
  .refine((d) => d.amount === undefined || d.currency !== undefined, {
    message: "paymentValidationCurrencyRequired",
    path: ["currency"],
  })
  .refine((d) => d.currency === undefined || d.amount !== undefined, {
    message: "amountRequired",
    path: ["amount"],
  });

export const paymentRecordEditSchema = z.object({
  amount: z.number().nonnegative("paymentValidationAmountNegative"),
  currency: z.string().min(1, "paymentValidationCurrencyRequired"),
  status: z.enum(["paid", "pending", "cancelled"], {
    errorMap: () => ({ message: "paymentValidationInvalidStatus" }),
  }),
  method: z.enum(["cash", "transfer", "other"], {
    errorMap: () => ({ message: "paymentValidationInvalidMethod" }),
  }),
});
