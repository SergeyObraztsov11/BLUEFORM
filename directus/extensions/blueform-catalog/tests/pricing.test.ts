import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pricesFromKopecks, pricesToKopecks } from '../src/pricing.ts';

test('existing prices round-trip with and without discounts', () => {
  for (const original of [
    { priceKopecks: 479000, oldPriceKopecks: null },
    { priceKopecks: 399050, oldPriceKopecks: 479000 },
  ]) {
    const fields = pricesFromKopecks(original.priceKopecks, original.oldPriceKopecks);
    assert.deepEqual(pricesToKopecks(fields.regularPrice, fields.salePrice), original);
  }
});

test('removing a discount restores the regular price', () => {
  assert.deepEqual(pricesToKopecks(4790, ''), { priceKopecks: 479000, oldPriceKopecks: null });
});

test('rejects invalid regular prices and discounts', () => {
  for (const [regular, sale] of [
    [null, null],
    [0, null],
    [100, 100],
    [100, 101],
    [100, 0],
    [100, 1.001],
  ]) {
    assert.throws(() => pricesToKopecks(regular, sale));
  }
});
