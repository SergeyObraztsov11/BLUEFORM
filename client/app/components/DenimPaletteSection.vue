<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import type SwiperCore from 'swiper';
import { A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { ArrowBackW400 as ArrowBack } from '@material-symbols-svg/vue/sharp/icons/arrow-back';
import { ArrowForwardW400 as ArrowForward } from '@material-symbols-svg/vue/sharp/icons/arrow-forward';
import { fabrics } from '~/data/catalog';
import 'swiper/css';

const slider = shallowRef<SwiperCore | null>(null);
const canPrev = ref(false);
const canNext = ref(true);

function syncControls(instance: SwiperCore) {
  slider.value = instance;
  canPrev.value = !instance.isBeginning;
  canNext.value = !instance.isEnd;
}
</script>

<template>
  <section id="denim-palette" class="overflow-hidden bg-white py-9 md:py-12" aria-labelledby="palette-title">
    <div
      class="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_minmax(250px,320px)] md:gap-x-12"
    >
      <h2
        id="palette-title"
        class="type-heading text-[clamp(2.7rem,5vw,4.7rem)] text-ink max-md:text-[clamp(2.1rem,8.6vw,3rem)]"
      >
        ПАЛИТРА<br />ДЕНИМА
      </h2>
      <div>
        <p class="type-body max-w-[320px]">
          От глубокого синего до ледяного голубого — выбирай оттенок под любимые вещи или собери новый образ
          вокруг него.
        </p>
        <div class="mt-5 flex justify-end gap-2" aria-label="Листать ткани">
          <button
            type="button"
            :disabled="!canPrev"
            class="flex size-10 items-center justify-center border border-cobalt text-cobalt transition-colors hover:bg-cobalt hover:text-white disabled:cursor-default disabled:border-seam disabled:text-seam disabled:hover:bg-transparent"
            aria-label="Предыдущий оттенок"
            @click="slider?.slidePrev()"
          >
            <ArrowBack :size="21" aria-hidden="true" />
          </button>
          <button
            type="button"
            :disabled="!canNext"
            class="flex size-10 items-center justify-center border border-cobalt text-cobalt transition-colors hover:bg-cobalt hover:text-white disabled:cursor-default disabled:border-seam disabled:text-seam disabled:hover:bg-transparent"
            aria-label="Следующий оттенок"
            @click="slider?.slideNext()"
          >
            <ArrowForward :size="21" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <div class="mt-5 min-w-0 md:mt-6">
      <Swiper
        class="w-full"
        :modules="[A11y]"
        :slides-per-view="1.35"
        :space-between="12"
        :breakpoints="{
          640: { slidesPerView: 2.4, spaceBetween: 16 },
          1024: { slidesPerView: 3.5, spaceBetween: 18 },
          1280: { slidesPerView: 4.75, spaceBetween: 20 },
        }"
        :grab-cursor="true"
        @swiper="syncControls"
        @slide-change="syncControls"
        @breakpoint="syncControls"
      >
        <SwiperSlide v-for="fabric in fabrics" :key="fabric.name" class="!h-auto">
          <article class="flex h-full min-w-0 flex-col border border-seam bg-white p-3 sm:p-4">
            <img
              :src="fabric.image"
              :alt="`Крупный план ткани «${fabric.name}»`"
              class="h-[175px] w-full object-cover sm:h-[185px]"
              width="800"
              height="800"
              loading="lazy"
            />
            <h3 class="mt-4 text-[1.125rem] leading-tight font-bold tracking-[-0.02em] text-ink">
              {{ fabric.name }}
            </h3>
            <p
              class="mt-2 flex items-center gap-2 font-mono text-[0.75rem] font-medium tracking-[0.04em] text-ink"
            >
              <span
                class="size-3 shrink-0 border border-ink/15"
                :style="{ backgroundColor: fabric.hex }"
                aria-hidden="true"
              />
              {{ fabric.hex }}
            </p>
            <span class="type-label mt-5 flex items-center gap-2 self-start text-cobalt">
              Смотреть оттенок
              <ArrowForward :size="17" aria-hidden="true" />
            </span>
          </article>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>
