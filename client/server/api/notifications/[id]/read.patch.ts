import { currentUserId } from '../../../utils/guest';
import { apiError } from '../../../utils/http';
import { toNotificationResponse } from '../../../utils/notifications';
import { prisma } from '../../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const id = getRouterParam(event, 'id');
  if (!id) apiError('NOTIFICATION_NOT_FOUND');

  const existing = await prisma.notification.findFirst({ where: { id, userId } });
  if (!existing) apiError('NOTIFICATION_NOT_FOUND');

  const notification =
    existing.readAt === null
      ? await prisma.notification.update({
          where: { id: existing.id },
          data: { readAt: new Date() },
        })
      : existing;

  return toNotificationResponse(notification);
});
