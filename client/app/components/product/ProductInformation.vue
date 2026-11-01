<script setup lang="ts">
import { ref } from 'vue';
import { KeyboardArrowDownW400 as ArrowDown } from '@material-symbols-svg/vue/sharp/icons/keyboard-arrow-down';
import type { CatalogProduct } from '~/data/catalog';

const props = defineProps<{ product: CatalogProduct }>();
type Section = 'description' | 'features' | 'fit' | 'model';
const openSection = ref<Section | null>(null);
const panelId = (section: Section) => `product-${props.product.id}-${section}`;
const toggle = (section: Section) => {
  openSection.value = openSection.value === section ? null : section;
};
</script>

<template>
  <div class="mt-10 border-t border-seam">
    <div v-if="product.description" class="border-b border-seam">
      <button
        type="button"
        class="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-ink hover:text-cobalt"
        :aria-expanded="openSection === 'description'"
        :aria-controls="panelId('description')"
        @click="toggle('description')"
      >
        О модели
        <ArrowDown
          :size="21"
          class="shrink-0 text-cobalt transition-transform duration-300"
          :class="openSection === 'description' ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
      <div
        :id="panelId('description')"
        class="product-accordion-panel"
        :class="openSection === 'description' ? 'is-open' : ''"
        :aria-hidden="openSection !== 'description'"
      >
        <div class="overflow-hidden">
          <p class="pb-5 text-sm leading-6 text-ink/70">{{ product.description }}</p>
        </div>
      </div>
    </div>
    <div class="border-b border-seam">
      <button
        type="button"
        class="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-ink hover:text-cobalt"
        :aria-expanded="openSection === 'features'"
        :aria-controls="panelId('features')"
        @click="toggle('features')"
      >
        Характеристики
        <ArrowDown
          :size="21"
          class="shrink-0 text-cobalt transition-transform duration-300"
          :class="openSection === 'features' ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
      <div
        :id="panelId('features')"
        class="product-accordion-panel"
        :class="openSection === 'features' ? 'is-open' : ''"
        :aria-hidden="openSection !== 'features'"
      >
        <div class="overflow-hidden">
          <dl class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-5 gap-y-3 pb-5 text-sm">
            <dt class="text-ink/55">Фасон</dt>
            <dd class="text-right text-ink">{{ product.fit }}</dd>
            <dt class="text-ink/55">Цвет</dt>
            <dd class="text-right text-ink">{{ product.shade }}</dd>
            <dt class="text-ink/55">Коллекция</dt>
            <dd class="text-right text-ink">{{ product.category === 'women' ? 'Женщинам' : 'Мужчинам' }}</dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="border-b border-seam">
      <button
        type="button"
        class="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-ink hover:text-cobalt"
        :aria-expanded="openSection === 'fit'"
        :aria-controls="panelId('fit')"
        @click="toggle('fit')"
      >
        Размер и фасон
        <ArrowDown
          :size="21"
          class="shrink-0 text-cobalt transition-transform duration-300"
          :class="openSection === 'fit' ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
      <div
        :id="panelId('fit')"
        class="product-accordion-panel"
        :class="openSection === 'fit' ? 'is-open' : ''"
        :aria-hidden="openSection !== 'fit'"
      >
        <div class="overflow-hidden pb-5 text-sm leading-6 text-ink/70">
          <p>
            Размеры указаны по российской сетке. Доступные размеры:
            {{ product.sizes.map((size) => size.code).join(', ') }}.
          </p>
          <p class="mt-2">
            Фасон: {{ product.fit.toLocaleLowerCase('ru-RU') }}. Для выбора ориентируйся на свой привычный
            размер одежды.
          </p>
        </div>
      </div>
    </div>
    <div v-if="product.model" class="border-b border-seam">
      <button
        type="button"
        class="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-ink hover:text-cobalt"
        :aria-expanded="openSection === 'model'"
        :aria-controls="panelId('model')"
        @click="toggle('model')"
      >
        <span>Параметры модели</span>
        <span class="ml-auto text-right text-xs font-normal text-ink/55"
          >{{ product.model.heightCm }} см · размер {{ product.model.size }}</span
        >
        <ArrowDown
          :size="21"
          class="shrink-0 text-cobalt transition-transform duration-300"
          :class="openSection === 'model' ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
      <div
        :id="panelId('model')"
        class="product-accordion-panel"
        :class="openSection === 'model' ? 'is-open' : ''"
        :aria-hidden="openSection !== 'model'"
      >
        <div class="overflow-hidden">
          <dl class="grid grid-cols-2 gap-2 pb-5 sm:grid-cols-3">
            <div class="bg-ice px-3 py-4">
              <dt class="text-xs text-ink/60">Рост</dt>
              <dd class="mt-1 text-lg font-bold text-ink">{{ product.model.heightCm }} см</dd>
            </div>
            <div class="bg-ice px-3 py-4">
              <dt class="text-xs text-ink/60">Размер на модели</dt>
              <dd class="mt-1 text-lg font-bold text-ink">{{ product.model.size }}</dd>
            </div>
            <div v-if="product.model.weightKg" class="bg-ice px-3 py-4">
              <dt class="text-xs text-ink/60">Вес</dt>
              <dd class="mt-1 text-lg font-bold text-ink">{{ product.model.weightKg }} кг</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
