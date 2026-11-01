import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');

  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return { ok: true as const, updated: result.count };
});
