import { allowedOrderTransitions, isOrderStatus, type OrderStatusCode } from '../../../shared/order-status';
import { apiError } from './http';
import { createOrderStatusNotification, notifyOrderStatusByEmail } from './notifications';
import { toOrderResponse } from './orderResponse';
import { prisma } from './prisma';

const orderInclude = { items: { orderBy: { id: 'asc' as const } } };

export async function listAdminOrders(query: string | undefined) {
  const q = query?.trim();
  const orders = await prisma.order.findMany({
    where: q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { trackingNumber: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: orderInclude,
  });
  return { items: orders.map(toOrderResponse) };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) apiError('ORDER_NOT_FOUND');
  return toOrderResponse(order);
}

export async function updateAdminOrder(
  id: string,
  patch: {
    status?: OrderStatusCode;
    adminComment?: string | null;
    trackingNumber?: string | null;
  },
) {
  const existing = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!existing) apiError('ORDER_NOT_FOUND');

  if (patch.status !== undefined) {
    if (!isOrderStatus(patch.status)) apiError('ORDER_STATUS_INVALID');
    if (patch.status === existing.status) apiError('ORDER_STATUS_SAME');
    if (!allowedOrderTransitions(existing.status).includes(patch.status)) {
      apiError('ORDER_STATUS_INVALID');
    }
  }

  const nextStatus = patch.status ?? (existing.status as OrderStatusCode);
  const shouldRestock = patch.status === 'CANCELLED' && existing.status !== 'CANCELLED';
  const trackingNumber = patch.trackingNumber !== undefined ? patch.trackingNumber : existing.trackingNumber;

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldRestock) {
      for (const item of existing.items) {
        await tx.sku.update({
          where: { id: item.skuId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    const order = await tx.order.update({
      where: { id },
      data: {
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.adminComment !== undefined ? { adminComment: patch.adminComment } : {}),
        ...(patch.trackingNumber !== undefined ? { trackingNumber: patch.trackingNumber } : {}),
      },
      include: orderInclude,
    });

    if (patch.status && existing.userId) {
      await createOrderStatusNotification(tx, {
        userId: existing.userId,
        orderId: order.id,
        status: nextStatus,
        trackingNumber,
      });
    }

    return order;
  });

  if (patch.status && existing.userId) {
    void notifyOrderStatusByEmail({
      email: existing.email,
      orderId: updated.id,
      status: nextStatus,
      trackingNumber,
    }).catch(() => undefined);
  }

  return toOrderResponse(updated);
}
