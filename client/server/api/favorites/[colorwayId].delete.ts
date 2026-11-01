import { ownerForRead } from '../../utils/guest';
import { apiError } from '../../utils/http';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const colorwayId = getRouterParam(event, 'colorwayId');
  if (!colorwayId) apiError('FAVORITE_MISSING');
  const owner = await ownerForRead(event);
  if (!owner) return { ok: true };
  await prisma.favorite.deleteMany({ where: { ...owner, colorwayId } });
  return { ok: true };
});
