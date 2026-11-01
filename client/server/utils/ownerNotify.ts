import { sendShopMail } from './mail';
import { prisma } from './prisma';

export async function resolveOwnerNotifyEmails() {
  const fromEnv = (process.env.OWNER_NOTIFY_EMAIL || process.env.ADMIN_NOTIFY_EMAIL || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (fromEnv.length) return [...new Set(fromEnv)];

  const admins = await prisma.user.findMany({
    where: { role: 'admin', banned: { not: true } },
    select: { email: true },
    take: 10,
  });
  const emails = admins.map((admin) => admin.email).filter(Boolean);
  return emails.length ? emails : ['admin@blueform.local'];
}

export async function notifyOwnerNewOrder(input: {
  orderId: string;
  totalRubles: number;
  firstName: string;
  phone: string;
  email: string;
}) {
  const recipients = await resolveOwnerNotifyEmails();
  const shortId = input.orderId.slice(-8).toUpperCase();
  const text = [
    `Новый заказ № ${shortId}`,
    `Сумма: ${input.totalRubles.toLocaleString('ru-RU')} ₽`,
    `Покупатель: ${input.firstName}`,
    `Телефон: ${input.phone}`,
    `Почта: ${input.email}`,
    '',
    'Оплата условная — деньги не списаны.',
    `Открыть в админке: /admin/orders/${input.orderId}`,
  ].join('\n');

  await Promise.all(
    recipients.map((to) =>
      sendShopMail({
        to,
        subject: `BLUEFORM — новый заказ № ${shortId}`,
        text,
      }),
    ),
  );
}
