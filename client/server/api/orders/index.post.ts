import { ownerWhere } from '../../utils/cart';
import { currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { createOrderCreatedNotification, notifyOrderCreatedByEmail } from '../../utils/notifications';
import { toOrderResponse } from '../../utils/orderResponse';
import { prisma } from '../../utils/prisma';
import { orderBody, parseBody } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const body = parseBody(orderBody, await readBody(event));
  const owner = { userId };

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: ownerWhere(owner),
      include: {
        items: {
          where: { removed: false, quantity: { gt: 0 } },
          include: {
            sku: { include: { size: true, colorway: { include: { product: true, fabric: true } } } },
          },
        },
      },
    });
    const items = cart?.items ?? [];
    if (!items.length) apiError('ORDER_CART_EMPTY');

    for (const item of items) {
      const updated = await tx.sku.updateMany({
        where: { id: item.skuId, isActive: true, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (updated.count !== 1) {
        apiError('ORDER_INSUFFICIENT_STOCK', {
          product: item.sku.colorway.product.name,
          shade: item.sku.colorway.fabric.colorName,
          size: item.sku.size.code,
        });
      }
    }

    const totalKopecks = items.reduce((sum, item) => sum + item.sku.priceKopecks * item.quantity, 0);
    const created = await tx.order.create({
      data: {
        userId,
        email: body.email,
        firstName: body.firstName,
        phone: body.phone,
        deliveryCity: body.deliveryCity,
        deliveryAddress: body.deliveryAddress,
        deliveryPostalCode: body.deliveryPostalCode,
        deliveryComment: body.deliveryComment || null,
        totalKopecks,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            priceKopecks: item.sku.priceKopecks,
            productName: item.sku.colorway.product.name,
            shade: item.sku.colorway.fabric.colorName,
            sizeCode: item.sku.size.code,
          })),
        },
      },
      include: { items: { orderBy: { id: 'asc' } } },
    });

    await createOrderCreatedNotification(tx, {
      userId,
      orderId: created.id,
      totalRubles: created.totalKopecks / 100,
    });

    await tx.cartItem.deleteMany({ where: { id: { in: items.map((item) => item.id) } } });
    await tx.customerProfile.upsert({
      where: { userId },
      create: { userId, firstName: body.firstName, phone: body.phone },
      update: { firstName: body.firstName, phone: body.phone },
    });
    return created;
  });

  void notifyOrderCreatedByEmail({
    email: order.email,
    orderId: order.id,
    totalRubles: order.totalKopecks / 100,
  }).catch(() => undefined);

  return toOrderResponse(order);
});
