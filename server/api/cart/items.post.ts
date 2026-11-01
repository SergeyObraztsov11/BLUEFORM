import { readCart, ownerWhere } from '../../utils/cart'
import { ownerForWrite } from '../../utils/guest'
import { apiError } from '../../utils/http'
import { prisma } from '../../utils/prisma'
import { cartItemBody, parseBody } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = parseBody(cartItemBody, await readBody(event))
  const sku = await prisma.sku.findFirst({
    where: {
      isActive: true,
      size: { code: body.size },
      colorway: { id: body.colorwayId, status: 'PUBLISHED', product: { status: 'PUBLISHED' } },
    },
    select: { id: true, stockQuantity: true },
  })
  if (!sku) apiError('CART_SKU_UNAVAILABLE')

  const owner = await ownerForWrite(event)
  const cart = await prisma.cart.upsert({
    where: ownerWhere(owner),
    update: {},
    create: owner,
  })
  const existing = await prisma.cartItem.findUnique({ where: { cartId_skuId: { cartId: cart.id, skuId: sku.id } } })
  const quantity = (existing && !existing.removed ? existing.quantity : 0) + 1
  if (quantity > sku.stockQuantity) apiError('OUT_OF_STOCK', { stock: sku.stockQuantity })
  await prisma.cartItem.upsert({
    where: { cartId_skuId: { cartId: cart.id, skuId: sku.id } },
    create: { cartId: cart.id, skuId: sku.id, quantity, removed: false },
    update: { quantity, removed: false },
  })
  return readCart(owner)
})
