import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import {
  ensureRegistrationNotification,
  notifyRegistrationByEmail,
  toNotificationResponse,
} from '../../utils/notifications';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user?.emailVerified) apiError('SESSION_REQUIRED');

  const { notification, created } = await ensureRegistrationNotification(prisma, {
    userId: user.id,
  });

  if (created) {
    void notifyRegistrationByEmail(user.email).catch(() => undefined);
  }

  return { created, notification: toNotificationResponse(notification) };
});
