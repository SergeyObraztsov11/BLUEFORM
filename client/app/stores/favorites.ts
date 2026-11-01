import { ref } from 'vue';
import { defineStore } from 'pinia';
import { apiErrorMessage, requestHeaders } from '~/utils/apiError';
import type { CatalogProduct } from '~/data/catalog';

type FavoritesResponse = { items: CatalogProduct[] };

let chain = Promise.resolve();

function enqueue<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<CatalogProduct[]>([]);
  const loaded = ref(false);
  const error = ref<string | null>(null);

  function apply(response: FavoritesResponse) {
    items.value = response.items;
    loaded.value = true;
  }

  function isFavorite(id: string) {
    return items.value.some((item) => item.id === id);
  }

  async function load() {
    apply(await $fetch<FavoritesResponse>('/api/favorites', { headers: requestHeaders() }));
  }

  function toggleFavorite(id: string) {
    return enqueue(async () => {
      const removing = isFavorite(id);
      try {
        if (removing) await $fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        else await $fetch(`/api/favorites/${id}`, { method: 'PUT' });
        await load();
        error.value = null;
        return null;
      } catch (reason) {
        error.value = apiErrorMessage(reason);
        return error.value;
      }
    });
  }

  return { items, loaded, error, isFavorite, load, toggleFavorite };
});
