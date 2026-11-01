export function apiErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (typeof data?.message === 'string' && data.message) return data.message;
  }
  return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
}

export function requestHeaders() {
  return import.meta.server ? useRequestHeaders(['cookie']) : undefined;
}
