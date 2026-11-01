<script setup lang="ts">
import { scrollToSection } from '~/composables/useSectionNavigation';

type FooterLink = { label: string; to: string } | { label: string; href: string };

const footerGroups: { title: string; label: string; links: FooterLink[] }[] = [
  {
    title: 'Коллекция',
    label: 'Коллекция',
    links: [
      { label: 'Женщинам', to: '/catalog?category=women' },
      { label: 'Мужчинам', to: '/catalog?category=men' },
      { label: 'Распродажа', to: '/catalog?sale=1' },
    ],
  },
  {
    title: 'Выбор денима',
    label: 'Выбор денима',
    links: [
      { label: 'Все товары', to: '/catalog' },
      { label: 'Палитра денима', href: '#denim-palette' },
    ],
  },
  {
    title: 'О BLUEFORM',
    label: 'О BLUEFORM',
    links: [
      { label: 'Наш подход', href: '#about' },
      { label: 'Главная', href: '#top' },
    ],
  },
];
</script>

<template>
  <footer class="site-footer w-full text-white">
    <div class="mx-auto w-full max-w-[1280px] px-4 pb-7 pt-12 sm:px-6 xl:px-8 lg:pt-14">
      <div class="grid gap-x-8 gap-y-8 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:pb-14">
        <nav v-for="group in footerGroups" :key="group.title" :aria-label="group.label">
          <h2 class="text-[1.125rem] leading-tight font-semibold">{{ group.title }}</h2>
          <ul class="mt-6 space-y-3">
            <li v-for="link in group.links" :key="link.label">
              <NuxtLink
                v-if="'to' in link"
                :to="link.to"
                class="text-sm leading-6 text-white/75 transition-colors hover:text-white focus-visible:text-white"
                >{{ link.label }}</NuxtLink
              >
              <a
                v-else
                :href="`/${link.href}`"
                class="text-sm leading-6 text-white/75 transition-colors hover:text-white focus-visible:text-white"
                @click.prevent="scrollToSection(link.href)"
                >{{ link.label }}</a
              >
            </li>
          </ul>
        </nav>

        <div>
          <h2 class="text-[1.125rem] leading-tight font-semibold">Покупателям</h2>
          <ul class="mt-6 space-y-3">
            <li>
              <NuxtLink
                to="/catalog"
                class="text-sm leading-6 text-white/75 transition-colors hover:text-white"
                >Каталог</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/favorites"
                class="text-sm leading-6 text-white/75 transition-colors hover:text-white"
                >Избранное</NuxtLink
              >
            </li>
            <li>
              <NuxtLink to="/cart" class="text-sm leading-6 text-white/75 transition-colors hover:text-white"
                >Корзина</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/20 py-6 text-xs text-white/60"
      >
        <p>© {{ new Date().getFullYear() }} BLUEFORM</p>
        <p>Деним в твоём ритме</p>
      </div>

      <p class="max-w-[760px] text-xs leading-5 text-white/50">
        BLUEFORM — одежда из денима разных силуэтов и оттенков. Выбирай свою форму и носи в своём ритме.
      </p>
    </div>
  </footer>
</template>
