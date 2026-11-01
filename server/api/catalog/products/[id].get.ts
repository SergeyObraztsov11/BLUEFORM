import { colorwayInclude, publishedColorwayWhere, toCatalogCard } from '../../../utils/catalog'
import { apiError } from '../../../utils/http'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) apiError('PRODUCT_NOT_FOUND')
  const colorway = await prisma.productColorway.findFirst({
    where: { id, ...publishedColorwayWhere },
    include: colorwayInclude,
  })
  const card = colorway && toCatalogCard(colorway)
  if (!card) apiError('PRODUCT_NOT_FOUND')
  return card
})
