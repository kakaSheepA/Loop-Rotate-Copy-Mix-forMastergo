<template>
  <header class="header">
    <p class="eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
  </header>
</template>

<script lang="ts" setup>
defineProps<{
  eyebrow: string
  title: string
}>()
</script>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #9ca3af;
}

h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 700;
  color: #1f2937;
}
</style>
