import type { NotificationType, PrismaClient } from '../generated/prisma/client';
import { orderStatusLabel } from '../../../shared/order-status';
import { sendShopMail } from './mail';

type Db = Pick<PrismaClient, 'notification'>;

export function toNotificationResponse(notification: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    orderId: notification.orderId,
    read: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function createOrderCreatedNotification(
  db: Db,
  input: { userId: string; orderId: string; totalRubles: number },
) {
  const title = 'Заказ принят';
  const body = `Заказ № ${input.orderId.slice(-8).toUpperCase()} на сумму ${input.totalRubles.toLocaleString('ru-RU')} ₽ сохранён. Статус: ${orderStatusLabel('NEW')}. Оплата условная — деньги не списаны.`;
  const href = `/orders/${input.orderId}`;
  return db.notification.create({
    data: {
      userId: input.userId,
      type: 'ORDER_CREATED',
      title,
      body,
      href,
      orderId: input.orderId,
    },
  });
}

export async function notifyOrderCreatedByEmail(input: {
  email: string;
  orderId: string;
  totalRubles: number;
}) {
  const title = 'Заказ принят';
  const body = `Заказ № ${input.orderId.slice(-8).toUpperCase()} на сумму ${input.totalRubles.toLocaleString('ru-RU')} ₽ сохранён. Статус: ${orderStatusLabel('NEW')}. Оплата условная — деньги не списаны.`;
  await sendShopMail({
    to: input.email,
    subject: 'BLUEFORM — заказ принят',
    text: `${title}\n\n${body}\n\nОткрыть заказ: /orders/${input.orderId}`,
  });
}

export async function ensureRegistrationNotification(db: Db, input: { userId: string }) {
  const existing = await db.notification.findFirst({
    where: { userId: input.userId, type: 'REGISTRATION_SUCCESS' },
  });
  if (existing) return { notification: existing, created: false };

  const title = 'Регистрация завершена';
  const body = 'Аккаунт BLUEFORM создан. Можно оформлять заказы и сохранять избранное.';
  const href = '/orders';
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: 'REGISTRATION_SUCCESS',
      title,
      body,
      href,
    },
  });
  return { notification, created: true };
}

export async function notifyRegistrationByEmail(email: string) {
  await sendShopMail({
    to: email,
    subject: 'BLUEFORM — добро пожаловать',
    text: 'Регистрация завершена.\n\nАккаунт BLUEFORM создан. Можно оформлять заказы и сохранять избранное.',
  });
}

export async function createOrderStatusNotification(
  db: Db,
  input: { userId: string; orderId: string; status: string; trackingNumber?: string | null },
) {
  const statusLabel = orderStatusLabel(input.status);
  const title = `Статус заказа: ${statusLabel}`;
  const tracking =
    input.trackingNumber && input.status === 'SHIPPED' ? ` Трек-номер: ${input.trackingNumber}.` : '';
  const body = `Заказ № ${input.orderId.slice(-8).toUpperCase()} теперь «${statusLabel}».${tracking}`;
  const href = `/orders/${input.orderId}`;
  return db.notification.create({
    data: {
      userId: input.userId,
      type: 'ORDER_STATUS_CHANGED',
      title,
      body,
      href,
      orderId: input.orderId,
    },
  });
}

export async function notifyOrderStatusByEmail(input: {
  email: string;
  orderId: string;
  status: string;
  trackingNumber?: string | null;
}) {
  const statusLabel = orderStatusLabel(input.status);
  const tracking =
    input.trackingNumber && input.status === 'SHIPPED' ? `\nТрек-номер: ${input.trackingNumber}` : '';
  await sendShopMail({
    to: input.email,
    subject: `BLUEFORM — статус заказа: ${statusLabel}`,
    text: `Заказ № ${input.orderId.slice(-8).toUpperCase()} теперь «${statusLabel}».${tracking}\n\nОткрыть заказ: /orders/${input.orderId}`,
  });
}
