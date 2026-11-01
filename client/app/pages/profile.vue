<script setup lang="ts">
definePageMeta({ middleware: 'account' });
useHead({ title: 'Профиль — BLUEFORM', meta: [{ name: 'robots', content: 'noindex, nofollow' }] });
</script>

<template>
  <AccountPlaceholder title="ПРОФИЛЬ" lead="Имя, почта и телефон." />
</template>
