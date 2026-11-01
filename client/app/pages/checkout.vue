<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAccountStore } from '~/stores/account'
import { useCartStore } from '~/stores/cart'
import { apiErrorMessage } from '~/utils/apiError'

const cart = useCartStore()
const account = useAccountStore()
const firstName = ref('')
const phone = ref('')
const email = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const orderId = ref<string | null>(null)

watch(() => account.profile, (profile) => {
  if (!profile) {
    email.value = ''
    firstName.value = ''
    phone.value = ''
    return
  }
  email.value = profile.email
  firstName.value = profile.firstName
  phone.value = profile.phone
}, { immediate: true })

async function submitOrder() {
  error.value = null
  submitting.value = true
  try {
    const order = await $fetch<{ id: string }>('/api/orders', {
      method: 'POST',
      body: { firstName: firstName.value, phone: phone.value, email: email.value },
    })
    orderId.value = order.id
    await cart.load()
    if (account.isAuthenticated) await account.refresh()
  } catch (reason) {
    error.value = apiErrorMessage(reason)
  } finally {
    submitting.value = false
  }
}

useHead({ title: 'Оформление заказа — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <section class="min-h-[70vh] pb-20 pt-5 md:pt-6">
    <ShopPageBanner title="ОФОРМЛЕНИЕ ЗАКАЗА" lead="Проверь выбранные размеры, количество и сумму заказа." />

    <div class="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div class="min-w-0 border-t border-seam pt-7">
        <h2 class="text-2xl font-bold text-ink">{{ orderId ? 'Заказ создан' : 'Данные для оформления' }}</h2>
        <p v-if="orderId" class="mt-5 max-w-[640px] text-sm leading-6 text-ink/70">Номер заказа <span class="font-semibold text-ink">{{ orderId }}</span>. Оплата и доставка появятся позже, состав заказа уже сохранён.</p>
        <form v-else class="mt-7 grid gap-5 sm:grid-cols-2" @submit.prevent="submitOrder">
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink">Имя<input v-model.trim="firstName" type="text" autocomplete="given-name" required placeholder="Как к вам обращаться" class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"></label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink">Телефон<input v-model.trim="phone" type="tel" autocomplete="tel" required placeholder="+7" class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"></label>
          <label class="flex flex-col gap-2 text-sm font-semibold text-ink sm:col-span-2">Электронная почта<input v-model.trim="email" type="email" autocomplete="email" required placeholder="mail@example.ru" class="h-12 border border-seam bg-white px-4 font-normal outline-none focus:border-cobalt"></label>
          <p v-if="error" class="text-sm text-error sm:col-span-2" role="alert">{{ error }}</p>
          <p v-if="cart.hasStockIssues" class="text-sm text-error sm:col-span-2" role="alert">Вернитесь в корзину и проверьте наличие и количество товаров.</p>
          <button type="submit" class="shop-button-primary sm:col-span-2" :disabled="submitting || !cart.activeLines.length || cart.hasStockIssues">ОФОРМИТЬ ЗАКАЗ</button>
        </form>
        <NuxtLink to="/cart" class="mt-8 inline-flex text-sm font-semibold text-cobalt hover:text-ink">← Вернуться в корзину</NuxtLink>
      </div>

      <aside class="bg-ice p-6 sm:p-8 lg:sticky lg:top-28" aria-label="Состав заказа">
        <p class="type-label text-cobalt">ВАШ ЗАКАЗ</p>
        <h2 class="mt-3 text-2xl font-bold text-ink">Состав заказа</h2>
        <ul class="mt-6 divide-y divide-ink/15 border-y border-ink/15">
          <li v-for="line in cart.activeLines" :key="line.key" class="py-4">
            <p class="text-sm font-semibold text-ink">{{ line.product.name }}</p>
            <p class="mt-1 text-xs text-ink/60">{{ line.product.shade }} · размер {{ line.size }} · {{ line.quantity }} шт.</p>
            <p class="mt-2 text-sm font-bold text-ink">{{ line.lineTotal.toLocaleString('ru-RU') }} ₽</p>
          </li>
          <li v-if="!cart.activeLines.length" class="py-5 text-sm text-ink/60">В корзине нет товаров для оформления.</li>
        </ul>
        <div class="mt-5 flex items-baseline justify-between gap-4 text-lg font-bold text-ink"><span>Итого</span><span>{{ cart.total.toLocaleString('ru-RU') }} ₽</span></div>
      </aside>
    </div>
  </section>
</template>
