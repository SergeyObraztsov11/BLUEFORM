import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';
import type { CatalogProduct } from '~/data/catalog';

export type CartLine = {
  key: string;
  product: CatalogProduct;
  size: string;
  quantity: number;
  removed: boolean;
  lineTotal: number;
};

export function cartLineInStock(product: Pick<CatalogProduct, 'sizes'>, size: string) {
  return (product.sizes.find((item) => item.code === size)?.stock ?? 0) > 0;
}

type CartResponse = { items: CartLine[] };

let chain = Promise.resolve();

function enqueue<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLine[]>([]);
  const loaded = ref(false);
  const error = ref<string | null>(null);
  const removedLines = computed(() => items.value.filter((line) => line.removed));
  const lines = computed(() => {
    const visible = items.value.filter((line) => !line.removed);
    const available = visible.filter((line) => cartLineInStock(line.product, line.size));
    const unavailable = visible.filter((line) => !cartLineInStock(line.product, line.size));
    return [...available, ...unavailable];
  });
  const activeLines = computed(() => lines.value.filter((line) => cartLineInStock(line.product, line.size)));
  const hasStockIssues = computed(() =>
    lines.value.some((line) => {
      const stock = line.product.sizes.find((size) => size.code === line.size)?.stock ?? 0;
      return line.quantity > stock || line.quantity > 99;
    }),
  );
  const totalQuantity = computed(() => activeLines.value.reduce((sum, line) => sum + line.quantity, 0));
  const total = computed(() => activeLines.value.reduce((sum, line) => sum + line.lineTotal, 0));

  function apply(response: CartResponse) {
    items.value = response.items;
    loaded.value = true;
  }

  async function load() {
    apply(await $fetch<CartResponse>('/api/cart', { headers: requestHeaders() }));
  }

  function addItem(productId: string, size: string) {
    return enqueue(async () => {
      try {
        apply(
          await $fetch<CartResponse>('/api/cart/items', {
            method: 'POST',
            body: { colorwayId: productId, size },
          }),
        );
        error.value = null;
        return null;
      } catch (reason) {
        error.value = apiErrorMessage(reason);
        return error.value;
      }
    });
  }

  function updateSelection(key: string, changes: Partial<Pick<CartLine, 'quantity' | 'removed'>>) {
    return enqueue(async () => {
      try {
        apply(await $fetch<CartResponse>(`/api/cart/items/${key}`, { method: 'PATCH', body: changes }));
        error.value = null;
        return null;
      } catch (reason) {
        error.value = apiErrorMessage(reason);
        return error.value;
      }
    });
  }

  function changeSize(key: string, size: string) {
    return enqueue(async () => {
      try {
        apply(await $fetch<CartResponse>(`/api/cart/items/${key}`, { method: 'PATCH', body: { size } }));
        error.value = null;
        return null;
      } catch (reason) {
        error.value = apiErrorMessage(reason);
        return error.value;
      }
    });
  }

  return {
    items,
    loaded,
    error,
    lines,
    removedLines,
    activeLines,
    hasStockIssues,
    totalQuantity,
    total,
    load,
    addItem,
    updateSelection,
    changeSize,
  };
});
