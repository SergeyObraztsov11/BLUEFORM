import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { toOrderResponse } from '../../utils/orderResponse';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  return { items: orders.map(toOrderResponse) };
});
