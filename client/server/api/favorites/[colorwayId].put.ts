import { ownerForWrite } from '../../utils/guest'
import { apiError } from '../../utils/http'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const colorwayId = getRouterParam(event, 'colorwayId')
  if (!colorwayId) apiError('FAVORITE_ID_MISSING')
  const colorway = await prisma.productColorway.findFirst({
    where: { id: colorwayId, status: 'PUBLISHED', product: { status: 'PUBLISHED' } },
    select: { id: true },
  })
  if (!colorway) apiError('FAVORITE_UNAVAILABLE')
  const owner = await ownerForWrite(event)
  await prisma.favorite.upsert({
    where: 'userId' in owner
      ? { userId_colorwayId: { userId: owner.userId, colorwayId } }
      : { guestId_colorwayId: { guestId: owner.guestId, colorwayId } },
    update: {},
    create: { ...owner, colorwayId },
  })
  return { ok: true }
})
