import { readCart, requireCartItem } from '../../../utils/cart';
import { ownerForRead } from '../../../utils/guest';
import { apiError } from '../../../utils/http';
import { prisma } from '../../../utils/prisma';
import { cartItemPatch, parseBody } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) apiError('CART_ITEM_MISSING');
  const body = parseBody(cartItemPatch, await readBody(event));
  const owner = await ownerForRead(event);
  if (!owner) apiError('CART_ITEM_OWNER_MISSING');
  const item = await requireCartItem(id, owner);

  if (body.size && body.size !== item.sku.size.code) {
    const nextSku = await prisma.sku.findFirst({
      where: {
        colorwayId: item.sku.colorwayId,
        isActive: true,
        size: { code: body.size },
        colorway: { status: 'PUBLISHED', product: { status: 'PUBLISHED' } },
      },
      select: { id: true, stockQuantity: true },
    });
    if (!nextSku) apiError('CART_SIZE_UNAVAILABLE');
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_skuId: { cartId: item.cartId, skuId: nextSku.id } },
    });
    const quantity = item.quantity + (existing && !existing.removed ? existing.quantity : 0);
    if (quantity > nextSku.stockQuantity) apiError('OUT_OF_STOCK', { stock: nextSku.stockQuantity });
    await prisma.$transaction(async (tx) => {
      if (existing && existing.id !== item.id) {
        await tx.cartItem.delete({ where: { id: item.id } });
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity, removed: false } });
      } else {
        await tx.cartItem.update({ where: { id: item.id }, data: { skuId: nextSku.id, removed: false } });
      }
    });
    return readCart(owner);
  }

  const quantity = body.quantity ?? item.quantity;
  const removed = body.removed ?? item.removed;
  const reducingExisting = !item.removed && body.quantity !== undefined && quantity < item.quantity;
  const colorway = await prisma.productColorway.findUnique({
    where: { id: item.sku.colorwayId },
    select: { status: true, product: { select: { status: true } } },
  });
  const available =
    item.sku.isActive && colorway?.status === 'PUBLISHED' && colorway.product.status === 'PUBLISHED';
  const stock = available ? item.sku.stockQuantity : 0;
  if (!removed && quantity > stock && !reducingExisting) apiError('OUT_OF_STOCK', { stock });
  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity, removed },
  });
  return readCart(owner);
});
