import { currentUserId } from '../../utils/guest';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) return { user: null };
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
    prisma.customerProfile.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true, phone: true },
    }),
  ]);
  if (!user) return { user: null };
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
    },
  };
});
