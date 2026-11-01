<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close';
import { AddW400 as Add } from '@material-symbols-svg/vue/sharp/icons/add';
import type { CatalogProduct } from '~/data/catalog';

const props = defineProps<{
  product: CatalogProduct;
  mode: 'add' | 'decrease';
  cartSizes: { size: string; quantity: number }[];
  visible: boolean;
}>();
const emit = defineEmits<{ close: []; confirm: [size: string]; 'after-leave': [] }>();

const selectedSize = ref('');
const sizeButtons = useTemplateRef<HTMLButtonElement[]>('sizeButtons');
const visibleSizes = computed(() =>
  props.mode === 'decrease'
    ? props.product.sizes.filter((size) =>
        props.cartSizes.some((line) => line.size === size.code && line.quantity > 1),
      )
    : props.product.sizes,
);

function countForSize(size: string) {
  return props.cartSizes.find((line) => line.size === size)?.quantity ?? 0;
}
</script>

<template>
  <UiModalShell
    :visible="visible"
    labelled-by="catalog-size-title"
    panel-class="shop-modal w-full max-w-[430px] bg-white p-6 sm:p-8"
    @close="emit('close')"
    @opened="sizeButtons?.[0]?.focus()"
    @after-leave="emit('after-leave')"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="type-label text-cobalt">
          {{ mode === 'add' ? 'ДОБАВИТЬ В КОРЗИНУ' : 'ИЗМЕНИТЬ КОЛИЧЕСТВО' }}
        </p>
        <h2 id="catalog-size-title" class="mt-2 text-2xl font-bold leading-tight text-ink">Выбери размер</h2>
      </div>
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center text-ink/60 hover:text-cobalt"
        aria-label="Закрыть выбор размера"
        @click="emit('close')"
      >
        <Close :size="22" aria-hidden="true" />
      </button>
    </div>
    <p class="mt-4 text-sm leading-6 text-ink/70">{{ product.name }} · {{ product.shade }}</p>
    <div class="mt-6 grid grid-cols-4 gap-2" role="group" aria-label="Доступные размеры">
      <button
        v-for="size in visibleSizes"
        :key="size.code"
        ref="sizeButtons"
        type="button"
        class="flex min-h-14 flex-col items-center justify-center border px-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:text-ink/35"
        :class="
          selectedSize === size.code
            ? 'border-cobalt bg-cobalt text-white'
            : 'border-seam text-ink hover:border-cobalt'
        "
        :aria-pressed="selectedSize === size.code"
        :disabled="mode === 'add' && size.stock < 1"
        @click="selectedSize = size.code"
      >
        <span>{{ size.code }}</span>
        <span
          v-if="countForSize(size.code)"
          class="mt-0.5 text-xs font-normal"
          :class="selectedSize === size.code ? 'text-white/85' : 'text-ink/55'"
          >{{ countForSize(size.code) }} в корзине</span
        >
        <span v-else-if="mode === 'add' && size.stock < 1" class="mt-0.5 text-xs font-normal">нет</span>
      </button>
    </div>
    <button
      type="button"
      class="shop-button-primary mt-7 w-full"
      :disabled="!selectedSize"
      @click="emit('confirm', selectedSize)"
    >
      <Add v-if="mode === 'add'" :size="20" aria-hidden="true" />{{
        mode === 'add' ? 'ДОБАВИТЬ 1 ШТ.' : 'УМЕНЬШИТЬ НА 1 ШТ.'
      }}
    </button>
  </UiModalShell>
</template>
