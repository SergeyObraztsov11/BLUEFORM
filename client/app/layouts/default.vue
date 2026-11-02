<template>
  <div id="top" class="flex min-h-screen flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] xl:pb-0">
    <div class="mx-auto w-full max-w-[1280px] flex-1 px-4 sm:px-6 xl:px-8">
      <SiteHeader />
      <main>
        <slot />
      </main>
    </div>
    <SiteFooter />
  </div>
</template>
