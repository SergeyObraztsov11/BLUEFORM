import { catalogCategories } from '../../../app/data/catalog-categories'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { slug: true } } },
  })
  return {
    items: categories.map(category => ({
      slug: category.slug,
      name: category.name,
      parent: category.parent?.slug ?? null,
      fit: catalogCategories.find(item => item.slug === category.slug)?.fit ?? null,
    })),
  }
})
