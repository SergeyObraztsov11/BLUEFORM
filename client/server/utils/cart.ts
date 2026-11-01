import type { Prisma } from '../generated/prisma/client';
import { colorwayInclude, rubles, toCatalogCard, type ColorwayRecord } from './catalog';
import { apiError } from './http';
import { prisma } from './prisma';

export const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      sku: {
        include: {
          size: true,
          colorway: { include: colorwayInclude },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export function ownerWhere(owner: { userId: string } | { guestId: string }) {
  return 'userId' in owner ? { userId: owner.userId } : { guestId: owner.guestId };
}

export function toCartResponse(cart: CartRecord | null) {
  const items = (cart?.items ?? []).flatMap((item) => {
    const card = toCatalogCard(
      item.sku.colorway as ColorwayRecord,
      item.sku as ColorwayRecord['skus'][number],
    );
    if (!card) return [];
    const price = rubles(item.sku.priceKopecks);
    const inStock = item.sku.stockQuantity > 0;
    return [
      {
        key: item.id,
        product: {
          ...card,
          price,
          oldPrice:
            item.sku.oldPriceKopecks != null && item.sku.oldPriceKopecks > item.sku.priceKopecks
              ? rubles(item.sku.oldPriceKopecks)
              : undefined,
        },
        size: item.sku.size.code,
        quantity: item.quantity,
        removed: item.removed,
        lineTotal: item.removed || !inStock ? 0 : price * item.quantity,
      },
    ];
  });
  return { items };
}

export async function readCart(owner: { userId: string } | { guestId: string } | null) {
  if (!owner) return toCartResponse(null);
  const cart = await prisma.cart.findUnique({ where: ownerWhere(owner), include: cartInclude });
  return toCartResponse(cart);
}

export async function requireCartItem(id: string, owner: { userId: string } | { guestId: string }) {
  const item = await prisma.cartItem.findFirst({
    where: { id, cart: ownerWhere(owner) },
    include: { sku: { include: { size: true } } },
  });
  if (!item) apiError('CART_ITEM_NOT_FOUND');
  return item;
}
