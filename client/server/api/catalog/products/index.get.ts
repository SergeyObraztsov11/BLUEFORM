import { colorwayInclude, publishedColorwayWhere, toCatalogCard } from '../../../utils/catalog'
import { catalogPage } from '../../../utils/catalogList'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const colorways = await prisma.productColorway.findMany({
    where: publishedColorwayWhere,
    include: colorwayInclude,
    orderBy: [{ product: { category: { sortOrder: 'asc' } } }, { product: { name: 'asc' } }, { fabric: { colorName: 'asc' } }],
  })
  const cards = colorways.flatMap((colorway) => {
    const card = toCatalogCard(colorway)
    return card ? [card] : []
  })
  return catalogPage(cards, getQuery(event))
})
