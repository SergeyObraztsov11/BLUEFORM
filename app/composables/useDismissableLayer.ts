import { toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

export function useDismissableLayer(
  target: Ref<HTMLElement | null>,
  isOpen: MaybeRefOrGetter<boolean>,
  close: (reason: 'outside' | 'escape') => void,
) {
  onClickOutside(target, () => { if (toValue(isOpen)) close('outside') })
  onKeyStroke('Escape', () => { if (toValue(isOpen)) close('escape') })
}
