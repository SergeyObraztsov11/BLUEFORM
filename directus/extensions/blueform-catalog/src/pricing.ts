export type PriceInput = number | string | null;

export function pricesFromKopecks(priceKopecks: number, oldPriceKopecks: number | null) {
  return {
    regularPrice: (oldPriceKopecks ?? priceKopecks) / 100,
    salePrice: oldPriceKopecks == null ? null : priceKopecks / 100,
  };
}

function toKopecks(value: PriceInput): number | null {
  if (value === '' || value == null) return null;
  const amount = Number(value);
  const kopecks = Math.round(amount * 100);
  if (
    !Number.isFinite(amount) ||
    kopecks <= 0 ||
    kopecks > 2147483647 ||
    Math.abs(amount * 100 - kopecks) > 0.000001
  )
    return null;
  return kopecks;
}

export function pricesToKopecks(regularPrice: PriceInput, salePrice: PriceInput) {
  const regular = toKopecks(regularPrice);
  if (regular == null)
    throw new Error('Укажите обычную цену больше нуля, не более двух знаков после запятой.');
  if (salePrice === '' || salePrice == null) return { priceKopecks: regular, oldPriceKopecks: null };
  const sale = toKopecks(salePrice);
  if (sale == null || sale >= regular)
    throw new Error(
      'Цена со скидкой должна быть больше нуля и меньше обычной цены, не более двух знаков после запятой.',
    );
  return { priceKopecks: sale, oldPriceKopecks: regular };
}
