import type { H3Event } from 'h3';
import { auth } from './auth';
import { apiError } from './http';
import { prisma } from './prisma';

export async function requireAdmin(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers });
  const userId = session?.user.id;
  if (!userId) apiError('SESSION_REQUIRED');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, banned: true },
  });
  if (!user || user.banned || user.role !== 'admin') apiError('ADMIN_REQUIRED');
  return user;
}
