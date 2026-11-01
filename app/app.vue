<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'bf-page', mode: 'out-in' }" />
  </NuxtLayout>
</template>
