import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { toOrderResponse } from '../../utils/orderResponse';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const id = getRouterParam(event, 'id');
  if (!id) apiError('ORDER_NOT_FOUND');
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { id: 'asc' } } },
  });
  if (!order) apiError('ORDER_NOT_FOUND');
  return toOrderResponse(order);
});
