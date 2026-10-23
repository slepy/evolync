import { z } from 'zod';

export const createOrderItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  currency: z.string().min(1),
});

export const createOrderSchema = z.object({
  schoolId: z.string().min(1),
  schoolMemberId: z.string().min(1),
  items: z.array(createOrderItemSchema).min(1),
  /** Placed for this event from 10D (an exam taker only). */
  eventId: z.string().uuid().optional(),
});

export type CreateOrderSchemaType = z.infer<typeof createOrderSchema>;
export type CreateOrderItemSchemaType = z.infer<typeof createOrderItemSchema>;
