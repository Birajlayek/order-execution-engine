import { z } from 'zod';

export const createOrderSchema = z.object({
  userId: z.string().min(1),
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amount: z.number().positive(),
  orderType: z.enum(['market', 'limit', 'sniper']),
  side: z.enum(['buy', 'sell']).optional(),
  limitPrice: z.number().positive().optional(),
  targetToken: z.string().optional(),
});

export function validateOrder(data: unknown) {
  return createOrderSchema.parse(data);
}
