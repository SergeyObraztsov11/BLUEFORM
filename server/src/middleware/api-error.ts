const errors = {
  PRODUCT_NOT_FOUND: { status: 404, message: 'Товар не найден.' },
  CATALOG_INVALID_SORT: { status: 400, message: 'Неизвестная сортировка.' },
  CATALOG_INVALID_PAGE: { status: 400, message: 'Некорректный номер страницы.' },
  CATALOG_INVALID_PRICE: { status: 400, message: 'Некорректная цена.' },
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code: keyof typeof errors;

  constructor(code: keyof typeof errors) {
    super(errors[code].message);
    this.code = code;
    this.status = errors[code].status;
  }
}

export function apiError(code: keyof typeof errors): never {
  throw new ApiError(code);
}
