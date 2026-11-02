<template>
  <section id="collection" aria-labelledby="collection-title">
    <SectionIntro
      :title="'ФОРМА НА\nКАЖДЫЙ ДЕНЬ'"
      description="Свободная штанина создаёт выразительный силуэт и оставляет место для движения каждый день."
      title-id="collection-title"
    />

    <div class="rhythm-two split-feature">
      <div class="relative min-h-0 overflow-hidden bg-ice max-md:aspect-[4/5] max-md:flex-none">
        <img
          src="/images/blueform-fit-light.webp"
          alt="Светло-голубые джинсы свободного кроя на модели"
          loading="lazy"
          class="h-full w-full object-cover object-[center_48%]"
        />
      </div>

      <div class="flex min-w-0 flex-col bg-ice p-7 lg:p-9 max-md:p-6">
        <div class="my-auto py-8 max-md:my-0 max-md:py-0">
          <h3
            class="type-heading text-[clamp(2.3rem,3.15vw,3.3rem)] text-ink max-md:text-[clamp(2rem,8.4vw,2.7rem)]"
          >
            СВОБОДНЫЙ<br />СИЛУЭТ
          </h3>
          <p class="type-body mt-5 max-w-[310px] max-md:mt-4">
            Сочетай с простой футболкой или строгим жакетом: свободная посадка работает в разных образах.
          </p>
          <NuxtLink
            to="/catalog"
            class="mt-6 inline-flex min-h-12 items-center text-sm font-bold tracking-[0.04em] text-cobalt transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            СМОТРЕТЬ КАТАЛОГ →
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
