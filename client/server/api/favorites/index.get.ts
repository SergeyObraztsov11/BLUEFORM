import { colorwayInclude, toCatalogCard } from '../../utils/catalog';
import { ownerForRead } from '../../utils/guest';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const owner = await ownerForRead(event);
  if (!owner) return { items: [] };
  const favorites = await prisma.favorite.findMany({
    where: owner,
    orderBy: { createdAt: 'asc' },
    include: { colorway: { include: colorwayInclude } },
  });
  return {
    items: favorites.flatMap((favorite) => {
      const card = toCatalogCard(favorite.colorway);
      if (
        card &&
        (favorite.colorway.status !== 'PUBLISHED' || favorite.colorway.product.status !== 'PUBLISHED')
      ) {
        card.sizes = card.sizes.map((size) => ({ ...size, stock: 0 }));
      }
      return card ? [card] : [];
    }),
  };
});
