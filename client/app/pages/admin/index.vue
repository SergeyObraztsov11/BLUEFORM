<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });
await navigateTo('/admin/orders', { replace: true });
</script>

<template>
  <p class="text-sm text-ink/60">Переход к заказам…</p>
</template>
