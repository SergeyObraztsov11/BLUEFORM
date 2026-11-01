import { z } from 'zod';
import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { prisma } from '../../utils/prisma';
import { parseBody } from '../../utils/validation';

const accountBody = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) => value === '' || value.length >= 5, 'Телефон короче 5 символов.')
    .optional(),
});

function stored(value: string | undefined) {
  if (value === undefined) return undefined;
  return value || null;
}

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const raw = await readBody(event);
  if (!raw || typeof raw !== 'object' || !('firstName' in raw || 'lastName' in raw || 'phone' in raw)) {
    apiError('PROFILE_NOTHING_TO_UPDATE');
  }
  const body = parseBody(accountBody, raw);
  const data: { firstName?: string | null; lastName?: string | null; phone?: string | null } = {};
  if (body.firstName !== undefined) data.firstName = stored(body.firstName);
  if (body.lastName !== undefined) data.lastName = stored(body.lastName);
  if (body.phone !== undefined) data.phone = stored(body.phone);
  const profile = await prisma.customerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) apiError('SESSION_REQUIRED');
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
    },
  };
});
