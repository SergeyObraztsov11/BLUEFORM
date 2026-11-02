<script setup lang="ts">
definePageMeta({ middleware: 'account' });
await navigateTo('/profile', { replace: true, redirectCode: 302 });
</script>

<template>
  <p class="text-sm text-ink/60">Переход к профилю…</p>
</template>
