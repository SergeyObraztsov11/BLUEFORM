<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue';
import { CloseW400 as Close } from '@material-symbols-svg/vue/sharp/icons/close';
import { authClient } from '~/utils/authClient';
import { apiErrorMessage } from '~/utils/apiError';
import { useAccountStore } from '~/stores/account';
import { useCartStore } from '~/stores/cart';
import { useFavoritesStore } from '~/stores/favorites';

type AuthMode = 'login' | 'register';
type AuthError = { message?: string; code?: string; status?: number } | null;

const props = defineProps<{ mode: AuthMode; visible: boolean }>();
const emit = defineEmits<{ close: []; switch: [mode: AuthMode]; 'after-leave': []; success: [] }>();
const account = useAccountStore();
const cart = useCartStore();
const favorites = useFavoritesStore();

const firstInput = ref<HTMLInputElement | null>(null);
const codeInputs = useTemplateRef<HTMLInputElement[]>('codeInputs');
const step = ref<'details' | 'code'>('details');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const code = ref(['', '', '', '', '']);
const error = ref<string | null>(null);
const submitting = ref(false);

function focusCodeInput(index: number) {
  void nextTick(() => codeInputs.value?.[index]?.focus());
}

function authMessage(reason: AuthError) {
  const codeName = reason?.code ?? '';
  if (codeName === 'USER_ALREADY_EXISTS' || codeName === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
    return 'Аккаунт с этой почтой уже есть. Войдите или подтвердите почту.';
  if (codeName === 'INVALID_EMAIL_OR_PASSWORD') return 'Неверная почта или пароль.';
  if (codeName === 'INVALID_OTP') return 'Неверный код.';
  if (codeName === 'OTP_EXPIRED') return 'Код истёк. Отправьте новый.';
  if (codeName === 'TOO_MANY_ATTEMPTS') return 'Слишком много попыток. Отправьте новый код.';
  if (codeName === 'EMAIL_NOT_VERIFIED') return 'Сначала подтвердите почту.';
  return 'Не получилось выполнить запрос. Проверьте данные и попробуйте ещё раз.';
}

async function finishSignIn() {
  await account.refresh();
  if (!account.isAuthenticated) {
    const signedIn = await authClient.signIn.email({ email: email.value, password: password.value });
    if (signedIn.error) {
      error.value = authMessage(signedIn.error);
      return;
    }
    await account.refresh();
  }
  try {
    await $fetch('/api/session/adopt', { method: 'POST' });
  } catch (reason) {
    error.value = apiErrorMessage(reason);
    return;
  }
  await Promise.all([cart.load(), favorites.load()]);
  emit('success');
}

async function submitDetails() {
  error.value = null;
  submitting.value = true;
  try {
    if (props.mode === 'register') {
      const result = await authClient.signUp.email({
        email: email.value,
        password: password.value,
        name: email.value,
      });
      if (result.error) {
        error.value = authMessage(result.error);
        return;
      }
      step.value = 'code';
      return;
    }
    const result = await authClient.signIn.email({ email: email.value, password: password.value });
    if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
      await authClient.emailOtp.sendVerificationOtp({ email: email.value, type: 'email-verification' });
      error.value = 'Подтвердите почту кодом из письма.';
      step.value = 'code';
      return;
    }
    if (result.error) {
      error.value = authMessage(result.error);
      return;
    }
    await finishSignIn();
  } finally {
    submitting.value = false;
  }
}

async function submitCode() {
  error.value = null;
  submitting.value = true;
  try {
    const result = await authClient.emailOtp.verifyEmail({ email: email.value, otp: code.value.join('') });
    if (result.error) {
      error.value = authMessage(result.error);
      return;
    }
    await finishSignIn();
  } finally {
    submitting.value = false;
  }
}

async function resendCode() {
  error.value = null;
  submitting.value = true;
  try {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: email.value,
      type: 'email-verification',
    });
    error.value = result.error ? authMessage(result.error) : 'Новый код отправлен.';
  } finally {
    submitting.value = false;
  }
}

function onCodeInput(index: number) {
  const digit = code.value[index]?.replace(/\D/g, '').slice(-1) ?? '';
  code.value[index] = digit;
  if (digit && index < 4) focusCodeInput(index + 1);
}

function onCodeKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !code.value[index] && index > 0) focusCodeInput(index - 1);
  if (event.key === 'ArrowLeft' && index > 0) focusCodeInput(index - 1);
  if (event.key === 'ArrowRight' && index < 4) focusCodeInput(index + 1);
}

function onCodePaste(event: ClipboardEvent) {
  const digits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 5);
  if (!digits) return;
  event.preventDefault();
  code.value = Array.from({ length: 5 }, (_, index) => digits[index] ?? '');
  focusCodeInput(Math.min(digits.length, 4));
}

watch(step, (value) => {
  if (value === 'code') focusCodeInput(0);
  else void nextTick(() => firstInput.value?.focus());
});

watch(
  () => props.mode,
  () => {
    step.value = 'details';
    email.value = '';
    password.value = '';
    error.value = null;
    code.value = ['', '', '', '', ''];
    void nextTick(() => firstInput.value?.focus());
  },
);
</script>

<template>
  <UiModalShell
    :visible="visible"
    :labelled-by="`auth-title-${mode}`"
    panel-class="shop-modal my-auto w-full max-w-[470px] bg-white"
    @close="emit('close')"
    @opened="firstInput?.focus()"
    @after-leave="emit('after-leave')"
  >
    <div class="flex items-start justify-between gap-4 bg-cobalt px-6 py-5 text-white sm:px-8 sm:py-6">
      <div>
        <p class="type-label text-white/80">BLUEFORM / ЛИЧНЫЙ КАБИНЕТ</p>
        <h2 :id="`auth-title-${mode}`" class="type-heading mt-3 text-[clamp(1.9rem,6vw,2.5rem)]">
          {{ mode === 'login' ? 'ВХОД' : step === 'code' ? 'КОД ИЗ ПИСЬМА' : 'РЕГИСТРАЦИЯ' }}
        </h2>
      </div>
      <button
        type="button"
        class="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center text-white transition-colors hover:bg-white/15"
        aria-label="Закрыть окно"
        @click="emit('close')"
      >
        <Close :size="24" aria-hidden="true" />
      </button>
    </div>

    <div class="px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
      <template v-if="step === 'details'">
        <p class="text-sm leading-6 text-ink/70">
          {{
            mode === 'login'
              ? 'Вход в личный кабинет BLUEFORM.'
              : 'Регистрация в BLUEFORM. Следующий шаг — подтверждение почты.'
          }}
        </p>
        <form class="mt-6 grid gap-4" autocomplete="off" @submit.prevent="submitDetails">
          <label class="grid gap-2 text-sm font-medium text-ink">
            Электронная почта
            <input
              ref="firstInput"
              v-model.trim="email"
              type="email"
              autocomplete="off"
              required
              placeholder="you@example.com"
              class="h-12 w-full border border-seam bg-white px-4 font-normal outline-none transition-colors placeholder:text-ink/35 focus:border-cobalt"
            />
          </label>
          <label class="grid gap-2 text-sm font-medium text-ink">
            Пароль
            <span
              class="flex h-12 items-center border border-seam transition-colors focus-within:border-cobalt"
            >
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                minlength="8"
                placeholder="Не менее 8 символов"
                class="min-w-0 flex-1 bg-transparent px-4 font-normal outline-none placeholder:text-ink/35"
              />
              <button
                type="button"
                class="h-full shrink-0 px-3 text-xs font-semibold text-cobalt hover:text-ink"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'СКРЫТЬ' : 'ПОКАЗАТЬ' }}
              </button>
            </span>
          </label>
          <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
          <button
            type="submit"
            class="mt-2 h-12 bg-cobalt px-5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:bg-ink/40"
            :disabled="submitting"
          >
            {{ mode === 'login' ? 'ВОЙТИ' : 'ПРОДОЛЖИТЬ' }}
          </button>
        </form>
        <div class="mt-6 border-t border-seam pt-5 text-sm text-ink/70">
          {{ mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
          <button
            type="button"
            class="ml-1 font-semibold text-cobalt hover:underline"
            @click="emit('switch', mode === 'login' ? 'register' : 'login')"
          >
            {{ mode === 'login' ? 'Зарегистрироваться' : 'Войти' }}
          </button>
        </div>
      </template>

      <template v-else>
        <p class="text-sm leading-6 text-ink/70">
          Введите пятизначный код для <span class="font-semibold text-ink">{{ email }}</span>
        </p>
        <form class="mt-6" @submit.prevent="submitCode">
          <div class="flex justify-between gap-2" @paste="onCodePaste">
            <input
              v-for="(_, index) in 5"
              :key="index"
              ref="codeInputs"
              v-model="code[index]"
              type="text"
              inputmode="numeric"
              pattern="[0-9]"
              maxlength="1"
              required
              :aria-label="`Цифра кода ${index + 1}`"
              class="h-14 min-w-0 w-full border border-seam bg-white text-center text-2xl font-semibold text-ink outline-none transition-colors focus:border-cobalt sm:h-16"
              @input="onCodeInput(index)"
              @keydown="onCodeKeydown($event, index)"
            />
          </div>
          <p v-if="error" class="mt-4 text-sm text-error" role="alert">{{ error }}</p>
          <button
            type="submit"
            class="mt-6 h-12 w-full bg-cobalt px-5 text-sm font-bold text-white transition-colors hover:bg-ink disabled:cursor-wait disabled:bg-ink/40"
            :disabled="submitting"
          >
            ПОДТВЕРДИТЬ ПОЧТУ
          </button>
        </form>
        <button
          type="button"
          class="mt-5 text-sm font-semibold text-cobalt hover:underline disabled:text-ink/40"
          :disabled="submitting"
          @click="resendCode"
        >
          Отправить код ещё раз
        </button>
        <button
          type="button"
          class="mt-3 block text-sm font-semibold text-cobalt hover:underline"
          @click="step = 'details'"
        >
          Изменить почту
        </button>
      </template>
    </div>
  </UiModalShell>
</template>
