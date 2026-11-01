const shopErrors = {
  PRODUCT_NOT_FOUND: { status: 404, message: 'Товар не найден.' },
  CATALOG_INVALID_SORT: { status: 400, message: 'Неизвестная сортировка.' },
  CATALOG_INVALID_PAGE: { status: 400, message: 'Некорректный номер страницы.' },
  CATALOG_INVALID_PRICE: { status: 400, message: 'Некорректная цена.' },
  CART_SKU_UNAVAILABLE: { status: 404, message: 'Этот товар или размер недоступен.' },
  CART_SIZE_UNAVAILABLE: { status: 404, message: 'Этот размер недоступен.' },
  CART_ITEM_NOT_FOUND: { status: 404, message: 'Позиция корзины не найдена.' },
  CART_ITEM_MISSING: { status: 404, message: 'Позиция корзины не найдена.' },
  CART_ITEM_OWNER_MISSING: { status: 404, message: 'Позиция корзины не найдена.' },
  CART_NOTHING_TO_UPDATE: { status: 400, message: 'Нечего обновлять.' },
  OUT_OF_STOCK: { status: 409, message: 'Недостаточно товара этого размера. В наличии: {stock} шт.' },
  FAVORITE_UNAVAILABLE: { status: 404, message: 'Этот товар недоступен.' },
  FAVORITE_ID_MISSING: { status: 404, message: 'Этот товар недоступен.' },
  FAVORITE_MISSING: { status: 404, message: 'Этого товара нет в избранном.' },
  ORDER_NO_CART: { status: 400, message: 'В корзине нет товаров для оформления.' },
  ORDER_CART_EMPTY: { status: 400, message: 'В корзине нет товаров для оформления.' },
  ORDER_NAME_REQUIRED: { status: 400, message: 'Укажите имя.' },
  ORDER_PHONE_REQUIRED: { status: 400, message: 'Укажите телефон.' },
  ORDER_EMAIL_INVALID: { status: 400, message: 'Укажите почту.' },
  ORDER_INSUFFICIENT_STOCK: {
    status: 409,
    message: 'Недостаточно товара: {product}, {shade}, размер {size}.',
  },
  ORDER_NOT_FOUND: { status: 404, message: 'Заказ не найден.' },
  NOTIFICATION_NOT_FOUND: { status: 404, message: 'Уведомление не найдено.' },
  SESSION_REQUIRED: { status: 401, message: 'Нужно войти в аккаунт.' },
  PROFILE_NOTHING_TO_UPDATE: { status: 400, message: 'Нечего обновлять.' },
  PROFILE_PHONE_INVALID: { status: 400, message: 'Укажите телефон.' },
  VALIDATION_FAILED: { status: 400, message: '{message}' },
} as const;

export type ShopErrorCode = keyof typeof shopErrors;

function text(template: string, vars?: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars?.[key] ?? ''));
}

export function shopError(code: ShopErrorCode, vars?: Record<string, string | number>) {
  const spec = shopErrors[code];
  return { status: spec.status, code, message: text(spec.message, vars) };
}
