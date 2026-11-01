import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { toNotificationResponse } from '../../utils/notifications';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    items: items.map(toNotificationResponse),
    unreadCount,
  };
});
