import { createHash, randomBytes } from 'node:crypto';
import type { H3Event } from 'h3';
import { auth } from './auth';
import { prisma } from './prisma';

export const GUEST_COOKIE = 'bf_guest';
const MAX_AGE = 60 * 60 * 24 * 180;

export function hashGuestToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  };
}

export function readGuestToken(event: H3Event) {
  return getCookie(event, GUEST_COOKIE) || null;
}

export function setGuestCookie(event: H3Event, token: string) {
  setCookie(event, GUEST_COOKIE, token, cookieOptions());
}

export function clearGuestCookie(event: H3Event) {
  deleteCookie(event, GUEST_COOKIE, { path: '/' });
}

async function guestIdFromCookie(event: H3Event) {
  const token = readGuestToken(event);
  if (!token) return null;
  const guest = await prisma.guestSession.findUnique({
    where: { tokenHash: hashGuestToken(token) },
    select: { id: true },
  });
  if (!guest) {
    clearGuestCookie(event);
    return null;
  }
  return guest.id;
}

function activeQuantity(quantity: number, removed: boolean) {
  return removed ? 0 : quantity;
}

export async function adoptGuest(event: H3Event, userId: string) {
  const token = readGuestToken(event);
  if (!token) return false;
  const merged = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM guest_sessions WHERE "tokenHash" = ${hashGuestToken(token)} FOR UPDATE
    `;
    if (!locked.length) return false;
    const guest = await tx.guestSession.findUnique({
      where: { id: locked[0]!.id },
      include: { cart: { include: { items: true } }, favorites: true },
    });
    if (!guest) return false;
    if (guest.cart?.items.length) {
      const userCart = await tx.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      for (const item of guest.cart.items) {
        const existing = await tx.cartItem.findUnique({
          where: { cartId_skuId: { cartId: userCart.id, skuId: item.skuId } },
        });
        const quantity =
          activeQuantity(existing?.quantity ?? 0, existing?.removed ?? true) +
          activeQuantity(item.quantity, item.removed);
        if (quantity > 0) {
          await tx.cartItem.upsert({
            where: { cartId_skuId: { cartId: userCart.id, skuId: item.skuId } },
            create: { cartId: userCart.id, skuId: item.skuId, quantity, removed: false },
            update: { quantity, removed: false },
          });
        } else if (!existing) {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              skuId: item.skuId,
              quantity: Math.max(item.quantity, 1),
              removed: true,
            },
          });
        }
      }
    }

    for (const favorite of guest.favorites) {
      await tx.favorite.upsert({
        where: { userId_colorwayId: { userId, colorwayId: favorite.colorwayId } },
        update: {},
        create: { userId, colorwayId: favorite.colorwayId },
      });
    }

    await tx.guestSession.delete({ where: { id: guest.id } });
    return true;
  });

  clearGuestCookie(event);
  return merged;
}

export async function discardGuest(event: H3Event) {
  const token = readGuestToken(event);
  if (!token) return false;
  const guest = await prisma.guestSession.findUnique({
    where: { tokenHash: hashGuestToken(token) },
    select: { id: true },
  });
  if (guest) await prisma.guestSession.delete({ where: { id: guest.id } });
  clearGuestCookie(event);
  return Boolean(guest);
}

export async function currentUserId(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers });
  return session?.user.id ?? null;
}

type CartOwner = { userId: string } | { guestId: string };

export async function ownerForRead(event: H3Event): Promise<CartOwner | null> {
  const userId = await currentUserId(event);
  if (userId) return { userId };
  const guestId = await guestIdFromCookie(event);
  return guestId ? { guestId } : null;
}

export async function ownerForWrite(event: H3Event): Promise<CartOwner> {
  const userId = await currentUserId(event);
  if (userId) return { userId };
  const existing = await guestIdFromCookie(event);
  if (existing) return { guestId: existing };
  const token = randomBytes(32).toString('base64url');
  const guest = await prisma.guestSession.create({ data: { tokenHash: hashGuestToken(token) } });
  setGuestCookie(event, token);
  return { guestId: guest.id };
}
