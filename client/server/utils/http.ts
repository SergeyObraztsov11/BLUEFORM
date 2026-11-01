import { shopError, type ShopErrorCode } from './errors'

export function apiError(code: ShopErrorCode, vars?: Record<string, string | number>): never {
  const spec = shopError(code, vars)
  throw createError({ statusCode: spec.status, message: spec.message, data: { code: spec.code } })
}
