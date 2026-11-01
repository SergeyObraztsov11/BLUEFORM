<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { useDismissableLayer } from '~/composables/useDismissableLayer'

const props = withDefaults(defineProps<{
  visible: boolean
  labelledBy: string
  panelClass?: string
  placement?: 'center' | 'right' | 'fullscreen'
}>(), { panelClass: '', placement: 'center' })
const emit = defineEmits<{ close: []; opened: []; 'after-leave': [] }>()

const panel = ref<HTMLElement | null>(null)
const scrollLocked = useScrollLock(() => typeof document === 'undefined' ? null : document.documentElement)
const { activate, deactivate } = useFocusTrap(panel, {
  initialFocus: false,
  escapeDeactivates: false,
  clickOutsideDeactivates: false,
  returnFocusOnDeactivate: true,
})

useDismissableLayer(panel, () => props.visible, () => emit('close'))

watch(() => props.visible, (visible) => {
  if (visible) {
    scrollLocked.value = true
  } else {
    deactivate()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  deactivate()
  scrollLocked.value = false
})

function afterLeave() {
  if (!props.visible) scrollLocked.value = false
  emit('after-leave')
}

function afterEnter() {
  if (!props.visible) return
  activate()
  emit('opened')
}
</script>

<template>
  <Teleport to="body">
    <Transition :name="placement === 'right' ? 'bf-side-modal' : placement === 'fullscreen' ? 'bf-bottom-modal' : 'bf-modal'" appear @after-enter="afterEnter" @after-leave="afterLeave">
      <div v-if="visible" :data-modal-placement="placement" class="fixed inset-0 z-[70] flex" :class="placement === 'right' ? 'justify-end overflow-hidden' : placement === 'fullscreen' ? 'items-stretch justify-stretch overflow-hidden' : 'items-center justify-center overflow-y-auto bg-ink/65 p-4 sm:p-6'">
        <div v-if="placement !== 'center'" data-modal-backdrop class="pointer-events-none absolute inset-0 bg-ink/65" aria-hidden="true" />
        <section ref="panel" role="dialog" aria-modal="true" :aria-labelledby="labelledBy" class="relative z-[1]" :class="panelClass">
          <slot />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
