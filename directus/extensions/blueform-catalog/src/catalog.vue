<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { pricesFromKopecks, pricesToKopecks, type PriceInput } from './pricing';

type Option = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  status?: string;
  stock?: number;
  price?: number | null;
  image?: { mediaId: string; source: string; storageKey: string } | null;
  preview?: string;
};
type Fabric = { id: string; colorName: string; colorHex: string };
type Size = { id: string; code: string; systemId: string };
type Image = {
  id?: string;
  fileId?: string;
  mediaId?: string;
  source?: string;
  storageKey?: string;
  preview?: string;
};
type Sku = {
  id?: string;
  sizeId: string;
  regularPrice: PriceInput;
  salePrice: PriceInput;
  stock: number;
  originalStock: number;
  active: boolean;
};
type Color = {
  id?: string;
  fabricId: string;
  status: string;
  images: Image[];
  skus: Sku[];
  newRegularPrice: PriceInput;
};
type Product = {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  sizeSystemId: string;
  status: string;
  colors: Color[];
};

const api = useApi();
const products = ref<Option[]>([]);
const categories = ref<Option[]>([]);
const systems = ref<Option[]>([]);
const fabrics = ref<Fabric[]>([]);
const sizes = ref<Size[]>([]);
const product = ref<Product | null>(null);
const busy = shallowRef(false);
const error = shallowRef('');
const success = shallowRef('');
const query = shallowRef('');
const savedState = shallowRef('');
const visibleProducts = computed(() =>
  products.value.filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase())),
);
const leafCategories = computed(() =>
  categories.value.filter((c) => !categories.value.some((other) => other.parentId === c.id)),
);
const selectedSizes = computed(() =>
  sizes.value.filter((size) => size.systemId === product.value?.sizeSystemId),
);

function message(cause: any) {
  return (
    cause?.response?.data?.message ||
    cause?.response?.data?.errors?.[0]?.message ||
    'Не удалось выполнить действие. Проверьте соединение и попробуйте ещё раз.'
  );
}
async function loadReferences() {
  const { data } = await api.get('/blueform-editor/data');
  products.value = data.products;
  categories.value = data.categories;
  systems.value = data.systems;
  fabrics.value = data.fabrics;
  sizes.value = data.sizes;
  await Promise.all(
    products.value.map(async (item) => {
      if (item.image) item.preview = await previewFor(item.image);
    }),
  );
}
async function previewFor(image: { mediaId?: string; source?: string; storageKey?: string }) {
  const path =
    image.source === 'STATIC' && image.mediaId
      ? `/blueform-editor/static/${encodeURIComponent(image.mediaId)}`
      : image.source === 'DIRECTUS' && image.storageKey?.startsWith('directus/')
        ? `/assets/${image.storageKey.slice(9).split('.')[0]}`
        : null;
  if (!path) return undefined;
  try {
    return URL.createObjectURL((await api.get(path, { responseType: 'blob' })).data);
  } catch {
    return undefined;
  }
}
function categoryLabel(category: Option) {
  const parent = categories.value.find((item) => item.id === category.parentId);
  const grandparent = categories.value.find((item) => item.id === parent?.parentId);
  return [grandparent?.name, parent?.name, category.name].filter(Boolean).join(' / ');
}
function hasChanges() {
  return product.value !== null && savedState.value !== JSON.stringify(product.value);
}
function mayLeave() {
  return !hasChanges() || window.confirm('Есть несохранённые изменения. Открыть другой товар?');
}
function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (hasChanges()) event.preventDefault();
}
function createProduct() {
  if (!mayLeave()) return;
  product.value = {
    name: '',
    description: '',
    categoryId: '',
    sizeSystemId: systems.value[0]?.id || '',
    status: 'DRAFT',
    colors: [],
  };
  error.value = '';
  success.value = '';
  savedState.value = JSON.stringify(product.value);
}
async function openProduct(id: string, afterSave = false) {
  if (!afterSave && !mayLeave()) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await api.get(`/blueform-editor/products/${encodeURIComponent(id)}`);
    product.value = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      categoryId: data.categoryId,
      sizeSystemId: data.sizeSystemId,
      status: data.status,
      colors: data.colors.map((color: any) => ({
        id: color.id,
        fabricId: color.fabricId,
        status: color.status,
        images: color.images,
        newRegularPrice: color.skus.length
          ? (color.skus[0].oldPriceKopecks ?? color.skus[0].priceKopecks) / 100
          : null,
        skus: color.skus.map((sku: any) => ({
          id: sku.id,
          sizeId: sku.sizeId,
          ...pricesFromKopecks(sku.priceKopecks, sku.oldPriceKopecks),
          stock: sku.stockQuantity,
          originalStock: sku.stockQuantity,
          active: sku.isActive,
        })),
      })),
    };
    for (const color of product.value!.colors) {
      for (const image of color.images) {
        image.preview = await previewFor(image);
      }
    }
    savedState.value = JSON.stringify(product.value);
  } catch (cause) {
    error.value = message(cause);
  } finally {
    busy.value = false;
  }
}
function addColor() {
  product.value?.colors.push({ fabricId: '', status: 'DRAFT', images: [], skus: [], newRegularPrice: null });
}
function skuFor(color: Color, sizeId: string) {
  return color.skus.find((sku) => sku.sizeId === sizeId);
}
function toggleSize(color: Color, sizeId: string, enabled: boolean) {
  const existing = skuFor(color, sizeId);
  if (existing && !existing.id && !enabled) color.skus.splice(color.skus.indexOf(existing), 1);
  else if (existing) existing.active = enabled;
  else if (enabled)
    color.skus.push({
      sizeId,
      regularPrice: color.newRegularPrice,
      salePrice: null,
      stock: 0,
      originalStock: 0,
      active: true,
    });
}
async function uploadFiles(color: Color, files: File[]) {
  if (!files.length) return;
  busy.value = true;
  error.value = '';
  try {
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type))
        throw new Error('Можно загрузить только изображения JPEG, PNG, WebP, AVIF или GIF');
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/files', form);
      color.images.push({ fileId: data.data.id, preview: URL.createObjectURL(file) });
    }
  } catch (cause: any) {
    error.value = cause?.message?.startsWith('Можно загрузить только изображения')
      ? cause.message
      : message(cause);
  } finally {
    busy.value = false;
  }
}
async function upload(color: Color, event: Event) {
  const input = event.target as HTMLInputElement;
  await uploadFiles(color, Array.from(input.files || []));
  input.value = '';
}
function dropFiles(color: Color, event: DragEvent) {
  if (!busy.value) void uploadFiles(color, Array.from(event.dataTransfer?.files || []));
}
function moveImage(color: Color, index: number) {
  const [image] = color.images.splice(index, 1);
  if (image) color.images.unshift(image);
}
async function save(status: string) {
  const item = product.value;
  if (!item) return;
  error.value = '';
  success.value = '';
  if (!item.name.trim() || !item.categoryId || !item.sizeSystemId) {
    error.value = 'Укажите название и категорию товара.';
    return;
  }
  for (const color of item.colors) {
    for (const sku of color.skus) {
      try {
        pricesToKopecks(sku.regularPrice, sku.salePrice);
      } catch (cause) {
        const size = sizes.value.find((entry) => entry.id === sku.sizeId)?.code || '';
        error.value = `Размер ${size}: ${cause instanceof Error ? cause.message : 'Проверьте цены.'}`;
        return;
      }
    }
  }
  const colors = item.colors.map((color) => ({
    id: color.id,
    fabricId: color.fabricId,
    status: status === 'PUBLISHED' && color.status === 'DRAFT' ? 'PUBLISHED' : color.status,
    images: color.images.map(({ id, fileId }) => ({ id, fileId })),
    skus: color.skus.map((sku) => ({
      id: sku.id,
      sizeId: sku.sizeId,
      ...pricesToKopecks(sku.regularPrice, sku.salePrice),
      stockQuantity: Number(sku.stock),
      originalStock: sku.originalStock,
      isActive: sku.active,
    })),
  }));
  busy.value = true;
  try {
    const { data } = await api.post('/blueform-editor/products', { ...item, status, colors });
    await loadReferences();
    await openProduct(data.id, true);
    success.value = status === 'PUBLISHED' ? 'Товар опубликован.' : 'Изменения сохранены.';
  } catch (cause) {
    error.value = message(cause);
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  window.addEventListener('beforeunload', warnBeforeUnload);
  try {
    await loadReferences();
  } catch (cause) {
    error.value = message(cause);
  }
});
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload));
</script>

<template>
  <private-view title="Товары">
    <div class="workspace">
      <aside class="sidebar" aria-label="Список товаров">
        <button class="primary full" type="button" @click="createProduct">Добавить товар</button>
        <label class="search-label"
          >Поиск<input v-model="query" class="input" type="search" placeholder="Название товара"
        /></label>
        <button
          v-for="item in visibleProducts"
          :key="item.id"
          class="product-link"
          :class="{ selected: item.id === product?.id }"
          type="button"
          @click="openProduct(item.id)"
        >
          <img v-if="item.preview" :src="item.preview" alt="" class="product-thumb" />
          <span class="product-summary"
            ><span>{{ item.name }}</span>
            <span class="product-meta"
              >{{
                item.status === 'PUBLISHED'
                  ? 'Опубликован'
                  : item.status === 'ARCHIVED'
                    ? 'Архив'
                    : 'Черновик'
              }}
              · {{ item.stock ?? 0 }} шт.<template v-if="item.price != null">
                · {{ item.price.toLocaleString('ru-RU') }} ₽</template
              ></span
            ></span
          >
        </button>
        <p v-if="!visibleProducts.length" class="muted">Товары не найдены.</p>
      </aside>
      <main class="content">
        <div v-if="error" class="notice error" role="alert">{{ error }}</div>
        <div v-if="success" class="notice success" role="status">{{ success }}</div>
        <div v-if="!product" class="empty">
          <h1>Товары магазина</h1>
          <p>Выберите товар слева или добавьте новый.</p>
        </div>
        <form v-else @submit.prevent="save(product.status)">
          <header class="heading">
            <div>
              <p class="muted">{{ product.id ? 'Редактирование товара' : 'Новый товар' }}</p>
              <h1>{{ product.name || 'Новый товар' }}</h1>
            </div>
            <span class="status">{{
              product.status === 'PUBLISHED'
                ? 'Опубликован'
                : product.status === 'ARCHIVED'
                  ? 'Архив'
                  : 'Черновик'
            }}</span>
          </header>
          <section class="section">
            <h2>Основное</h2>
            <label class="field"
              >Название
              <input
                v-model="product.name"
                class="input"
                maxlength="200"
                required
                placeholder="Например, свободные джинсы"
            /></label>
            <label class="field"
              >Категория
              <select v-model="product.categoryId" class="input" required>
                <option value="" disabled>Выберите категорию</option>
                <option v-for="category in leafCategories" :key="category.id" :value="category.id">
                  {{ categoryLabel(category) }}
                </option>
              </select></label
            >
            <label class="field"
              >Описание
              <textarea
                v-model="product.description"
                class="input"
                rows="4"
                placeholder="Расскажите о товаре"
              ></textarea>
            </label>
            <label v-if="systems.length > 1" class="field"
              >Размерная сетка
              <select
                v-model="product.sizeSystemId"
                class="input"
                :disabled="!!product.id || product.colors.length > 0"
              >
                <option v-for="system in systems" :key="system.id" :value="system.id">
                  {{ system.name }}
                </option>
              </select></label
            >
          </section>
          <section class="section">
            <div class="section-heading">
              <div>
                <h2>Цвета и размеры</h2>
                <p class="muted">Добавьте фотографии и укажите остатки для каждого цвета.</p>
              </div>
              <button class="secondary" type="button" @click="addColor">Добавить цвет</button>
            </div>
            <p v-if="!product.colors.length" class="hint">У товара пока нет цветов.</p>
            <article
              v-for="(color, colorIndex) in product.colors"
              :key="color.id || colorIndex"
              class="color-block"
            >
              <div class="color-heading">
                <label class="field"
                  >Цвет
                  <select v-model="color.fabricId" class="input" :disabled="!!color.id">
                    <option value="" disabled>Выберите цвет</option>
                    <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                      {{ fabric.colorName }}
                    </option>
                  </select></label
                ><button
                  v-if="!color.id"
                  class="text-button"
                  type="button"
                  @click="product.colors.splice(colorIndex, 1)"
                >
                  Убрать цвет</button
                ><label v-else class="check"
                  ><input
                    v-model="color.status"
                    type="checkbox"
                    true-value="PUBLISHED"
                    false-value="ARCHIVED"
                  />
                  Цвет доступен</label
                >
              </div>
              <div class="photo-heading">
                <h3>Фотографии</h3>
                <label class="upload" @dragover.prevent @drop.prevent="dropFiles(color, $event)"
                  >Загрузить или перетащить фотографии<input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    multiple
                    :disabled="busy"
                    @change="upload(color, $event)"
                /></label>
              </div>
              <p class="muted">
                Первая фотография — главная. Нажмите «Сделать главной», чтобы изменить порядок.
              </p>
              <div class="photos">
                <div v-for="(image, index) in color.images" :key="image.id || image.fileId" class="photo">
                  <img v-if="image.preview" :src="image.preview" alt="Фотография товара" />
                  <div v-else class="photo-placeholder">Фото</div>
                  <span v-if="index === 0">Главная</span
                  ><button v-else type="button" @click="moveImage(color, index)">Сделать главной</button
                  ><button type="button" @click="color.images.splice(index, 1)">Убрать</button>
                </div>
              </div>
              <div class="sizes-heading">
                <h3>Размеры и цены</h3>
                <label class="base-price"
                  >Обычная цена для новых размеров, ₽
                  <input
                    v-model.number="color.newRegularPrice"
                    class="input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="7 890"
                /></label>
              </div>
              <p class="muted price-hint">
                Укажите обычную цену. Цена со скидкой необязательна: если заполнить её, покупатель заплатит
                именно её.
              </p>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Размер</th>
                      <th>Доступен</th>
                      <th>Обычная цена, ₽</th>
                      <th class="sale-heading">Цена со скидкой, ₽</th>
                      <th>Остаток, шт.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="size in selectedSizes" :key="size.id">
                      <td>{{ size.code }}</td>
                      <td>
                        <input
                          :checked="!!skuFor(color, size.id)?.active"
                          type="checkbox"
                          :aria-label="`Доступен размер ${size.code}`"
                          @change="toggleSize(color, size.id, ($event.target as HTMLInputElement).checked)"
                        />
                      </td>
                      <template v-if="skuFor(color, size.id)"
                        ><td>
                          <input
                            v-model.number="skuFor(color, size.id)!.regularPrice"
                            class="input small"
                            type="number"
                            min="0.01"
                            step="0.01"
                            :aria-label="`Обычная цена размера ${size.code}`"
                          />
                        </td>
                        <td>
                          <input
                            v-model.number="skuFor(color, size.id)!.salePrice"
                            class="input small sale-input"
                            placeholder="Нет скидки"
                            type="number"
                            min="0.01"
                            step="0.01"
                            :aria-label="`Цена со скидкой размера ${size.code}`"
                          />
                        </td>
                        <td>
                          <input
                            v-model.number="skuFor(color, size.id)!.stock"
                            class="input small"
                            type="number"
                            min="0"
                            step="1"
                            :aria-label="`Остаток размера ${size.code}`"
                          /></td></template
                      ><template v-else><td colspan="3" class="muted">Выберите размер</td></template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </section>
          <div class="actions">
            <button
              v-if="product.id"
              class="primary"
              type="button"
              :disabled="busy"
              @click="save(product.status)"
            >
              {{ busy ? 'Сохраняем…' : 'Сохранить изменения' }}
            </button>
            <button class="secondary" type="button" :disabled="busy" @click="save('DRAFT')">
              Сохранить черновик</button
            ><button
              v-if="product.status !== 'PUBLISHED'"
              class="primary"
              type="button"
              :disabled="busy"
              @click="save('PUBLISHED')"
            >
              {{ busy ? 'Сохраняем…' : 'Опубликовать' }}</button
            ><button
              v-if="product.id"
              class="text-button"
              type="button"
              :disabled="busy"
              @click="save('ARCHIVED')"
            >
              В архив
            </button>
          </div>
        </form>
      </main>
    </div>
  </private-view>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: calc(100vh - 64px);
  color: var(--theme--foreground, #263238);
}
.sidebar {
  border-right: 1px solid var(--theme--border-color, #d8dfe3);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.content {
  max-width: 1050px;
  padding: 36px 48px 80px;
}
.heading,
.section-heading,
.color-heading,
.photo-heading,
.sizes-heading,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.heading {
  margin-bottom: 36px;
}
.heading h1,
.empty h1 {
  font-size: 28px;
  font-weight: 650;
  line-height: 1.2;
}
.section {
  border-top: 1px solid var(--theme--border-color, #d8dfe3);
  padding: 28px 0;
}
.section h2 {
  font-size: 19px;
  font-weight: 650;
  margin-bottom: 18px;
}
.section-heading h2 {
  margin-bottom: 4px;
}
.section h3 {
  font-size: 15px;
  font-weight: 650;
}
.field,
.search-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 18px;
}
.input {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid var(--theme--border-color, #cbd2d7);
  border-radius: 6px;
  background: var(--theme--background, #fff);
  color: inherit;
  font: inherit;
}
.input:focus-visible,
button:focus-visible {
  outline: 2px solid #6644db;
  outline-offset: 2px;
}
.product-link,
.text-button {
  background: none;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.product-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border-radius: 5px;
}
.product-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.product-thumb {
  width: 42px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  margin-right: 6px;
}
.product-meta {
  color: var(--theme--foreground-subdued, #56636b);
  font-size: 12px;
}
.product-link:hover,
.product-link.selected {
  background: var(--theme--background-accent, #edf0f2);
}
.primary,
.secondary,
.upload {
  border-radius: 6px;
  padding: 10px 16px;
  font-weight: 650;
  cursor: pointer;
}
.primary {
  border: 1px solid #6644db;
  background: #6644db;
  color: #fff;
}
.secondary,
.upload {
  border: 1px solid var(--theme--border-color, #cbd2d7);
  background: transparent;
  color: inherit;
}
.full {
  width: 100%;
}
.search-label {
  margin: 16px 0 4px;
}
.status,
.hint {
  background: var(--theme--background-accent, #edf0f2);
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 13px;
}
.muted {
  color: var(--theme--foreground-subdued, #56636b);
  font-size: 13px;
  line-height: 1.5;
}
.color-block {
  padding: 24px 0;
  border-bottom: 1px solid var(--theme--border-color, #d8dfe3);
}
.color-heading .field {
  width: 260px;
}
.check {
  white-space: nowrap;
  font-size: 13px;
}
.photo-heading,
.sizes-heading {
  margin: 18px 0 8px;
}
.upload input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.photos {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 0;
}
.photo {
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
}
.photo img,
.photo-placeholder {
  width: 120px;
  height: 120px;
  object-fit: cover;
  background: #eef0f1;
  border-radius: 5px;
}
.photo button {
  border: 0;
  background: transparent;
  color: #5940b5;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
}
.price-hint {
  margin: 0 0 12px;
}
.sale-heading {
  color: #b42318;
}
.input.sale-input {
  border-color: #e9aaa4;
  background: #fff5f4;
  color: #842118;
}
.input.sale-input::placeholder {
  color: #935e59;
  opacity: 1;
}
.base-price {
  font-size: 13px;
  font-weight: 600;
}
.base-price input {
  margin-top: 6px;
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}
th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--theme--border-color, #d8dfe3);
}
th {
  font-weight: 600;
}
.small {
  min-width: 100px;
  max-width: 140px;
}
.actions {
  justify-content: flex-start;
  flex-wrap: wrap;
  padding-top: 20px;
}
.notice {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 5px;
}
.error {
  background: #fae8e8;
  color: #7a2020;
}
.success {
  background: #e5f3e9;
  color: #1c6231;
}
.empty {
  padding-top: 60px;
}
.empty p {
  margin-top: 12px;
}
.text-button {
  color: #5940b5;
  font-weight: 600;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 760px) {
  .workspace {
    display: block;
  }
  .sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--theme--border-color, #d8dfe3);
  }
  .content {
    padding: 24px 18px;
  }
  .section-heading,
  .heading,
  .sizes-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
