<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue';
import { autoUpdate, flip, offset as floatingOffset, shift, useFloating } from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';
import { useDismissableLayer } from '~/composables/useDismissableLayer';

const open = defineModel<boolean>('open', { default: false });

const props = withDefaults(
  defineProps<{
    placement?: Placement;
    offset?: number;
    panelClass?: string;
    rootClass?: string;
  }>(),
  {
    placement: 'bottom-start',
    offset: 8,
    panelClass: '',
    rootClass: 'inline-flex',
  },
);

const root = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const panelId = useId();

const { floatingStyles, isPositioned } = useFloating(root, panel, {
  placement: () => props.placement,
  strategy: 'fixed',
  transform: false,
  open,
  middleware: () => [floatingOffset(props.offset), flip({ padding: 16 }), shift({ padding: 16 })],
  whileElementsMounted: autoUpdate,
});

const controls = computed(() => ({
  'aria-expanded': open.value,
  'aria-controls': panelId,
}));

function toggle() {
  open.value = !open.value;
}

function close(reason: 'outside' | 'escape') {
  if (!open.value) return;
  open.value = false;
  if (reason === 'escape') {
    void nextTick(() => {
      root.value?.querySelector<HTMLElement>('button, a, input, select, textarea')?.focus();
    });
  }
}

useDismissableLayer(root, open, close);
</script>

<template>
  <div ref="root" :class="rootClass">
    <slot name="trigger" :open="open" :toggle="toggle" :controls="controls" />
    <Transition name="bf-popover">
      <div
        v-if="open"
        :id="panelId"
        ref="panel"
        :style="[floatingStyles, { visibility: isPositioned ? 'visible' : 'hidden' }]"
        class="shop-popover fixed z-40 border border-seam bg-white"
        :class="panelClass"
      >
        <slot :close="() => close('outside')" />
      </div>
    </Transition>
  </div>
</template>
