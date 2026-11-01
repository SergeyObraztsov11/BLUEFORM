import { catalogCategories } from '../../../../shared/catalog-categories.js'
import { database } from '../../database.js'

export async function listCategories() {
  const categories = await database().category.findMany({
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
}
