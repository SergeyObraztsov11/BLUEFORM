import { z } from 'zod';
import type { ShopErrorCode } from './errors';
import { apiError } from './http';

export const cartItemBody = z.object({
  colorwayId: z.string().trim().min(1),
  size: z.string().trim().min(1),
});

export const cartItemPatch = z
  .object({
    quantity: z.number().int().min(1).max(99).optional(),
    removed: z.boolean().optional(),
    size: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => value.quantity !== undefined || value.removed !== undefined || value.size !== undefined,
    {
      message: 'Нечего обновлять.',
    },
  );

export const orderBody = z.object({
  firstName: z.string().trim().min(1, 'Укажите имя.').max(80),
  phone: z.string().trim().min(5, 'Укажите телефон.').max(32),
  email: z.email('Укажите почту.'),
  deliveryCity: z.string().trim().min(1, 'Укажите город.').max(120),
  deliveryAddress: z.string().trim().min(1, 'Укажите адрес доставки.').max(300),
  deliveryPostalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Укажите шестизначный индекс.'),
  deliveryComment: z.string().trim().max(1000).optional().default(''),
});

const messages: Record<string, ShopErrorCode> = {
  'Нечего обновлять.': 'CART_NOTHING_TO_UPDATE',
  'Укажите имя.': 'ORDER_NAME_REQUIRED',
  'Укажите телефон.': 'ORDER_PHONE_REQUIRED',
  'Телефон короче 5 символов.': 'PROFILE_PHONE_INVALID',
  'Укажите почту.': 'ORDER_EMAIL_INVALID',
};

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Проверьте введённые данные.';
    const code = messages[message] ?? 'VALIDATION_FAILED';
    apiError(code, code === 'VALIDATION_FAILED' ? { message } : undefined);
  }
  return parsed.data;
}
