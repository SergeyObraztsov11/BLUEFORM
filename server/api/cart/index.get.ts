import { readCart } from '../../utils/cart'
import { ownerForRead } from '../../utils/guest'

export default defineEventHandler(async (event) => readCart(await ownerForRead(event)))
